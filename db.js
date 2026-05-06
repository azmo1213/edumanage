(function (window) {
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
            const filters = [];
            if (courseId) {
                filters.push(['courseId', '==', courseId]);
            }
            const items = await queryCollection('grades', filters);
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
        }
    };

    window.MockDB = MockDB;
})(window);
