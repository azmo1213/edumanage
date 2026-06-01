(function (window) {
    const getUserRole = () => {
        const raw = sessionStorage.getItem('edu-session');
        if (!raw) return null;
        try {
            return JSON.parse(raw).role;
        } catch {
            return null;
        }
    };

    const getSessionUid = () => {
        const raw = sessionStorage.getItem('edu-session');
        if (!raw) return null;
        try {
            const session = JSON.parse(raw);
            return session.uid || null;
        } catch (error) {
            return null;
        }
    };

    const getFirestore = () => {
        if (!window.firebase || !firebase.firestore) {
            throw new Error('Firestore is not initialized');
        }
        return firebase.firestore();
    };

    const mapSnapshot = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const queryCollection = async (collectionName, filters = []) => {
        const uid = getSessionUid();
        if (!uid) return [];
        let query = getFirestore().collection(collectionName).where('uid', '==', uid);
        filters.forEach(([field, operator, value]) => {
            query = query.where(field, operator, value);
        });
        const snapshot = await query.get();
        return mapSnapshot(snapshot);
    };

    const getDocument = async (collectionName, docId) => {
        const uid = getSessionUid();
        if (!uid) return null;
        const doc = await getFirestore().collection(collectionName).doc(docId).get();
        if (!doc.exists) return null;
        const data = doc.data();
        if (data.uid && data.uid !== uid) return null;
        return { id: doc.id, ...data };
    };

    const sortPriority = {
        yuqori: 1,
        "o'rta": 2,
        past: 3
    };

    const sortTasks = (taskList) => {
        return taskList.slice().sort((a, b) => {
            if (a.isDone !== b.isDone) {
                return a.isDone ? 1 : -1;
            }
            return sortPriority[a.priority] - sortPriority[b.priority];
        });
    };

    const MockDB = {
        getStudent: async () => {
            return getDocument('students', getSessionUid());
        },

        getCourses: () => queryCollection('courses'),

        getCourseById: (id) => getDocument('courses', id),

        getSchedule: async ({ day } = {}) => {
            const filters = [];
            if (day) {
                filters.push(['day', '==', day]);
            }
            const items = await queryCollection('schedule', filters);
            return items.slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
        },

        getGrades: async ({ courseId } = {}) => {
            const uid = getSessionUid();
            const role = getUserRole();
            if (!uid) return [];

            let query = getFirestore().collection('grades');

            // If student, filter by studentId; if teacher, filter by uid
            if (role === 'talaba') {
                query = query.where('studentId', '==', uid);
            } else {
                query = query.where('uid', '==', uid);
            }

            if (courseId) {
                query = query.where('courseId', '==', courseId);
            }

            const snapshot = await query.get();
            const items = mapSnapshot(snapshot);
            return items.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        getNotifications: async () => {
            const items = await queryCollection('notifications');
            return items.slice().sort((a, b) => {
                if (a.isRead === b.isRead) {
                    return new Date(b.time) - new Date(a.time);
                }
                return a.isRead ? 1 : -1;
            });
        },

        markNotificationRead: async (id) => {
            const uid = getSessionUid();
            if (!uid) return [];
            const notificationRef = getFirestore().collection('notifications').doc(id);
            const notificationDoc = await notificationRef.get();
            if (notificationDoc.exists && notificationDoc.data().uid === uid) {
                await notificationRef.update({ isRead: true });
            }
            return MockDB.getNotifications();
        },

        getTasks: async () => sortTasks(await queryCollection('tasks')),

        toggleTask: async (id) => {
            const uid = getSessionUid();
            if (!uid) return null;
            const taskRef = getFirestore().collection('tasks').doc(id);
            const taskDoc = await taskRef.get();
            if (!taskDoc.exists || taskDoc.data().uid !== uid) {
                return null;
            }
            const taskData = taskDoc.data();
            const updated = { ...taskData, isDone: !taskData.isDone };
            await taskRef.update({ isDone: updated.isDone });
            return { id: taskDoc.id, ...updated };
        },

        getStats: async () => {
            const student = await MockDB.getStudent() || {};
            const notifications = await MockDB.getNotifications();
            const tasks = await MockDB.getTasks();
            const grades = await MockDB.getGrades({});
            const unreadCount = notifications.filter((item) => !item.isRead).length;
            const completedTasks = tasks.filter((task) => task.isDone).length;
            const pendingGrades = grades.filter((grade) => grade.status === 'kutilmoqda').length;
            return {
                gpa: student.gpa || 0,
                attendancePercent: student.attendancePercent || 0,
                unreadCount,
                completedTasks,
                pendingGrades,
                completedCredits: student.completedCredits || 0,
                totalCredits: student.totalCredits || 0,
                group: student.group || '',
                faculty: student.faculty || ''
            };
        },

        getGroups: () => queryCollection('groups'),

        getAttendance: async ({ groupId, date }) => {
            const filters = [];
            if (groupId) {
                filters.push(['groupId', '==', groupId]);
            }
            if (date) {
                filters.push(['date', '==', date]);
            }
            return queryCollection('attendance', filters);
        },

        saveAttendance: async (records) => {
            const uid = getSessionUid();
            if (!uid) return [];
            const attendanceRef = getFirestore().collection('attendance');
            await Promise.all(records.map(async (record, index) => {
                const existing = await attendanceRef
                    .where('uid', '==', uid)
                    .where('studentId', '==', record.studentId)
                    .where('date', '==', record.date)
                    .get();
                if (!existing.empty) {
                    const doc = existing.docs[0];
                    await doc.ref.set({ ...record, uid }, { merge: true });
                } else {
                    const newDoc = attendanceRef.doc(`attendance_${Date.now()}_${index}`);
                    await newDoc.set({ id: newDoc.id, ...record, uid });
                }
            }));
            return queryCollection('attendance');
        },

        saveGrade: async ({ studentId, courseId, type, score, maxScore }) => {
            const uid = getSessionUid();
            if (!uid) return [];
            const course = await getDocument('courses', courseId);
            const newId = `grade_${Date.now()}`;
            const newGrade = {
                id: newId,
                studentId,
                courseId,
                courseName: course ? course.name : '',
                type,
                score,
                maxScore,
                date: new Date().toISOString().split('T')[0],
                status: 'baholandi',
                uid
            };
            await getFirestore().collection('grades').doc(newId).set(newGrade);
            return MockDB.getGrades({});
        },

        getStudentsByGroup: async (groupId) => {
            const uid = getSessionUid();
            if (!uid) return [];
            const groupDoc = await getFirestore().collection('groups').doc(groupId).get();
            if (!groupDoc.exists || groupDoc.data().uid !== uid) {
                return [];
            }
            const groupData = groupDoc.data();
            const users = window.Auth ? window.Auth.getAllUsers() : [];
            return users.filter((user) => user.role === 'talaba' && groupData.students?.includes(user.id));
        },

        addTask: async (task) => {
            const uid = getSessionUid();
            if (!uid) return [];
            const newId = `task_${Date.now()}`;
            await getFirestore().collection('tasks').doc(newId).set({ id: newId, ...task, uid });
            return MockDB.getTasks();
        },

        addCourse: async (course) => {
            const uid = getSessionUid();
            if (!uid) return [];
            const newId = `c${Date.now()}`;
            await getFirestore().collection('courses').doc(newId).set({ id: newId, ...course, uid });
            return MockDB.getCourses();
        },

        deleteCourse: async (id) => {
            const uid = getSessionUid();
            if (!uid) return [];
            const courseRef = getFirestore().collection('courses').doc(id);
            const courseDoc = await courseRef.get();
            if (courseDoc.exists && courseDoc.data().uid === uid) {
                await courseRef.delete();
            }
            return MockDB.getCourses();
        },

        updateProfile: async function(uid, data) {
            await firebase.firestore().collection('users').doc(uid).update(data);
            const session = JSON.parse(sessionStorage.getItem('edu-session'));
            const updated = { ...session, ...data };
            sessionStorage.setItem('edu-session', JSON.stringify(updated));
            return updated;
        },

        getContract: async function() {
            const uid = getSessionUid();
            if (!uid) return null;
            try {
                const snapshot = await getFirestore()
                    .collection('contracts')
                    .where('studentId', '==', uid)
                    .limit(1)
                    .get();
                
                if (snapshot.empty) return null;
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            } catch (error) {
                console.error('[MockDB] Error getting contract:', error);
                return null;
            }
        },

        getAllUsers: async function() {
            try {
                const snapshot = await getFirestore().collection('users').get();
                return mapSnapshot(snapshot);
            } catch (error) {
                console.error('[MockDB] Error getting all users:', error);
                return [];
            }
        },

        getAllContracts: async function() {
            try {
                const snapshot = await getFirestore().collection('contracts').get();
                return mapSnapshot(snapshot);
            } catch (error) {
                console.error('[MockDB] Error getting all contracts:', error);
                return [];
            }
        },

        generateExcelReport: async function(groupId) {
            try {
                // Fetch students for the group
                const students = await MockDB.getStudentsByGroup(groupId);
                
                // Build data array with report columns
                const data = [];
                for (const student of students) {
                    // Fetch grades for this student
                    const uid = getSessionUid();
                    if (!uid) continue;
                    
                    const gradesSnapshot = await getFirestore()
                        .collection('grades')
                        .where('studentId', '==', student.id)
                        .get();
                    
                    const grades = gradesSnapshot.docs.map(doc => doc.data());
                    
                    // Calculate GPA
                    let gpa = 0;
                    if (grades.length > 0) {
                        const sum = grades.reduce((acc, g) => acc + (g.score || 0), 0);
                        gpa = sum / grades.length;
                    }
                    
                    // Get attendance percentage
                    const attendanceSnapshot = await getFirestore()
                        .collection('attendance')
                        .where('studentId', '==', student.id)
                        .get();
                    
                    const attendanceDocs = attendanceSnapshot.docs.map(doc => doc.data());
                    let attendancePercent = 0;
                    if (attendanceDocs.length > 0) {
                        const presentCount = attendanceDocs.filter(a => a.status === 'present').length;
                        attendancePercent = Math.round((presentCount / attendanceDocs.length) * 100);
                    }
                    
                    // Get contract status
                    const contractSnapshot = await getFirestore()
                        .collection('contracts')
                        .where('studentId', '==', student.id)
                        .limit(1)
                        .get();
                    
                    const contractStatus = contractSnapshot.empty ? 'Yo\'q' : 'Bor';
                    
                    data.push({
                        fullName: student.fullName || student.name || 'Noma\'lum',
                        GPA: gpa.toFixed(2),
                        attendancePercent: attendancePercent + '%',
                        contractStatus: contractStatus
                    });
                }
                
                // Create workbook using SheetJS
                if (!window.XLSX) {
                    console.error('SheetJS (XLSX) is not loaded');
                    return;
                }
                
                const ws = window.XLSX.utils.json_to_sheet(data);
                const wb = window.XLSX.utils.book_new();
                window.XLSX.utils.book_append_sheet(wb, ws, 'Hisobot');
                
                // Trigger download
                window.XLSX.writeFile(wb, 'edumanage-hisobot.xlsx');
                console.log('Excel report downloaded successfully');
            } catch (error) {
                console.error('Error generating Excel report:', error);
            }
        },

        generatePDFReport: async function(groupId) {
            try {
                // Fetch students for the group
                const students = await MockDB.getStudentsByGroup(groupId);
                
                // Build data array with report columns
                const data = [];
                for (const student of students) {
                    // Fetch grades for this student
                    const uid = getSessionUid();
                    if (!uid) continue;
                    
                    const gradesSnapshot = await getFirestore()
                        .collection('grades')
                        .where('studentId', '==', student.id)
                        .get();
                    
                    const grades = gradesSnapshot.docs.map(doc => doc.data());
                    
                    // Calculate GPA
                    let gpa = 0;
                    if (grades.length > 0) {
                        const sum = grades.reduce((acc, g) => acc + (g.score || 0), 0);
                        gpa = sum / grades.length;
                    }
                    
                    // Get attendance percentage
                    const attendanceSnapshot = await getFirestore()
                        .collection('attendance')
                        .where('studentId', '==', student.id)
                        .get();
                    
                    const attendanceDocs = attendanceSnapshot.docs.map(doc => doc.data());
                    let attendancePercent = 0;
                    if (attendanceDocs.length > 0) {
                        const presentCount = attendanceDocs.filter(a => a.status === 'present').length;
                        attendancePercent = Math.round((presentCount / attendanceDocs.length) * 100);
                    }
                    
                    // Get contract status
                    const contractSnapshot = await getFirestore()
                        .collection('contracts')
                        .where('studentId', '==', student.id)
                        .limit(1)
                        .get();
                    
                    const contractStatus = contractSnapshot.empty ? 'Yo\'q' : 'Bor';
                    
                    data.push({
                        no: data.length + 1,
                        name: student.fullName || student.name || 'Noma\'lum',
                        gpa: gpa.toFixed(2),
                        attendance: attendancePercent + '%',
                        contract: contractStatus
                    });
                }
                
                // Create PDF using jsPDF
                if (!window.jspdf || !window.jspdf.jsPDF) {
                    console.error('jsPDF is not loaded');
                    return;
                }
                
                const doc = new window.jspdf.jsPDF();
                
                // Add title
                doc.setFontSize(16);
                doc.text('Talabalar Hisoboti', 14, 22);
                
                // Prepare table data
                const tableData = data.map(row => [
                    row.no,
                    row.name,
                    row.gpa,
                    row.attendance,
                    row.contract
                ]);
                
                // Use autoTable if available, otherwise fallback to manual text
                if (doc.autoTable) {
                    doc.autoTable({
                        startY: 30,
                        head: [['№', 'Ism', 'GPA', 'Davomat%', 'Kontrakt holati']],
                        body: tableData,
                        margin: 14,
                        didDrawPage: function() {
                            // Footer
                            const pageSize = doc.internal.pageSize;
                            const pageHeight = pageSize.getHeight();
                            const pageWidth = pageSize.getWidth();
                            doc.setFontSize(10);
                            doc.text(
                                'Sana: ' + new Date().toLocaleDateString('uz-UZ'),
                                14,
                                pageHeight - 10
                            );
                        }
                    });
                } else {
                    // Fallback: manual text rendering
                    let yPosition = 30;
                    const lineHeight = 8;
                    const colWidths = [10, 60, 25, 30, 40];
                    const colPositions = [14, 24, 84, 109, 139];
                    
                    // Draw header
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'bold');
                    const headers = ['№', 'Ism', 'GPA', 'Davomat%', 'Kontrakt holati'];
                    colPositions.forEach((x, i) => {
                        doc.text(headers[i], x, yPosition);
                    });
                    
                    yPosition += lineHeight;
                    doc.setFont(undefined, 'normal');
                    
                    // Draw rows
                    tableData.forEach(row => {
                        if (yPosition > 270) {
                            doc.addPage();
                            yPosition = 14;
                        }
                        colPositions.forEach((x, i) => {
                            doc.text(String(row[i]), x, yPosition);
                        });
                        yPosition += lineHeight;
                    });
                }
                
                // Save PDF
                doc.save('edumanage-hisobot.pdf');
                console.log('PDF report downloaded successfully');
            } catch (error) {
                console.error('Error generating PDF report:', error);
            }
        }
    };

    window.MockDB = MockDB;
})(window);
