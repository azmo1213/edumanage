// seed-complete.js — Comprehensive Firestore seeding for all collections
window.SeedData = {
  testAccounts: [
    {
      email: 'admin@edumanage.com',
      password: 'Admin@2025',
      role: 'admin',
      fullName: 'Botir Rahimov',
      faculty: 'Axborot texnologiyalari',
      avatarColor: '#6C5CE7'
    },
    {
      email: 'teacher@edumanage.com',
      password: 'Teacher@2025',
      role: 'oquvchi',
      fullName: 'Sardor Toshmatov',
      subject: 'Veb dasturlash',
      faculty: 'Kompyuter fanlari',
      avatarColor: '#00B894'
    },
    {
      email: 'student1@edumanage.com',
      password: 'Student@2025',
      role: 'talaba',
      fullName: 'Alisher Nazarov',
      group: 'KI-31',
      faculty: 'Kompyuter injiniringi',
      semester: '6',
      gpa: 3.72,
      gpaLocal: 4.45,
      attendancePercent: 94,
      completedCredits: 45,
      totalCredits: 120,
      avatarColor: '#A29BFE'
    },
    {
      email: 'student2@edumanage.com',
      password: 'Student@2025',
      role: 'talaba',
      fullName: 'Malika Yusupova',
      group: 'KI-31',
      faculty: 'Kompyuter injiniringi',
      semester: '6',
      gpa: 3.55,
      gpaLocal: 4.20,
      attendancePercent: 88,
      completedCredits: 42,
      totalCredits: 120,
      avatarColor: '#FD79A8'
    }
  ],

  courseData: [
    {
      name: 'Algoritmlar nazariyasi',
      creditHours: 5,
      credits: 5,
      teacherName: 'Sardor Toshmatov',
      room: '310',
      color: 'blue',
      progress: 78,
      currentGrade: '4.5',
      description: 'Algoritmlarni tahlil qilish'
    },
    {
      name: "Ma'lumotlar bazasi",
      creditHours: 4,
      credits: 4,
      teacherName: 'Sardor Toshmatov',
      room: '205',
      color: 'purple',
      progress: 65,
      currentGrade: '4.0',
      description: 'SQL va NoSQL'
    },
    {
      name: 'Veb dasturlash',
      creditHours: 4,
      credits: 4,
      teacherName: 'Sardor Toshmatov',
      room: '110',
      color: 'green',
      progress: 90,
      currentGrade: '5.0',
      description: 'HTML, CSS, JS, PWA'
    },
    {
      name: 'Kompyuter tarmoqlari',
      creditHours: 3,
      credits: 3,
      teacherName: 'Sardor Toshmatov',
      room: '401',
      color: 'orange',
      progress: 55,
      currentGrade: '3.8',
      description: 'TCP/IP, HTTP'
    },
    {
      name: "Dasturiy ta'minot injiniringi",
      creditHours: 3,
      credits: 3,
      teacherName: 'Sardor Toshmatov',
      room: '215',
      color: 'red',
      progress: 70,
      currentGrade: '4.2',
      description: 'Agile, Scrum'
    }
  ],

  run: async function(onProgress) {
    const results = { success: [], failed: [] };

    if (!firebase || !firebase.auth || !firebase.firestore) {
      console.error('[SeedData] Firebase not initialized');
      return results;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const userMap = {};

    console.log('[SeedData] Starting comprehensive seeding...');

    // STEP 1: Create test accounts
    for (let i = 0; i < this.testAccounts.length; i++) {
      const account = this.testAccounts[i];
      try {
        if (onProgress) {
          onProgress(`${account.fullName} yaratilmoqda...`, Math.round((i / this.testAccounts.length) * 15));
        }

        let userCredential;
        try {
          console.log(`[SeedData] Creating user: ${account.email}`);
          userCredential = await auth.createUserWithEmailAndPassword(account.email, account.password);
          console.log(`[SeedData] User auth created: ${account.email}`);
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log(`[SeedData] User already exists: ${account.email}`);
            userCredential = await auth.signInWithEmailAndPassword(account.email, account.password);
          } else {
            throw authError;
          }
        }

        const uid = userCredential.user.uid;
        userMap[account.email] = uid;

        const userData = {
          uid,
          email: account.email,
          role: account.role,
          fullName: account.fullName,
          faculty: account.faculty,
          createdAt: firebase.firestore.Timestamp.now(),
          avatarColor: account.avatarColor || '#6C5CE7'
        };

        if (account.role === 'oquvchi') {
          userData.subject = account.subject;
        } else if (account.role === 'talaba') {
          userData.group = account.group;
          userData.semester = account.semester;
          userData.gpa = account.gpa;
          userData.gpaLocal = account.gpaLocal;
          userData.attendancePercent = account.attendancePercent;
          userData.completedCredits = account.completedCredits;
          userData.totalCredits = account.totalCredits;
        }

        console.log(`[SeedData] Creating Firestore user document for ${uid}...`);
        await db.collection('users').doc(uid).set(userData, { merge: true });
        results.success.push(`✓ ${account.fullName} (${account.role})`);
      } catch (error) {
        console.error(`[SeedData] Error creating ${account.email}:`, error);
        results.failed.push(`✗ ${account.fullName}: ${error.message}`);
      }
    }

    const teacherUid = userMap['teacher@edumanage.com'];
    const student1Uid = userMap['student1@edumanage.com'];
    const student2Uid = userMap['student2@edumanage.com'];

    // STEP 2: Create courses
    if (onProgress) onProgress('Fanlar yaratilmoqda...', 30);
    if (teacherUid) {
      try {
        console.log('[SeedData] Creating courses...');
        for (const course of this.courseData) {
          const courseDoc = db.collection('courses').doc();
          await courseDoc.set({
            id: courseDoc.id,
            ...course,
            uid: teacherUid,
            createdAt: firebase.firestore.Timestamp.now()
          });
        }
        results.success.push(`✓ ${this.courseData.length} ta fan yaratildi`);
      } catch (error) {
        console.error('[SeedData] Error creating courses:', error);
        results.failed.push(`✗ Fanlar: ${error.message}`);
      }
    }

    // STEP 3: Create schedule
    if (onProgress) onProgress('Dars jadvali yaratilmoqda...', 45);
    try {
      console.log('[SeedData] Creating schedules...');
      const scheduleData = [
        { subject: 'Algoritmlar', day: 'Du', startTime: '08:00', endTime: '09:30', room: '310', type: 'dars', teacherName: 'Sardor Toshmatov' },
        { subject: "Ma'lumotlar bazasi", day: 'Du', startTime: '10:00', endTime: '11:30', room: '205', type: 'dars', teacherName: 'Sardor Toshmatov' },
        { subject: 'Veb dasturlash', day: 'Se', startTime: '08:00', endTime: '09:30', room: '110', type: 'dars', teacherName: 'Sardor Toshmatov' },
        { subject: 'Kompyuter tarmoqlari', day: 'Ch', startTime: '13:00', endTime: '14:30', room: '401', type: 'dars', teacherName: 'Sardor Toshmatov' },
        { subject: "Dasturiy ta'minot", day: 'Pa', startTime: '10:00', endTime: '11:30', room: '215', type: 'dars', teacherName: 'Sardor Toshmatov' }
      ];

      for (const student of [student1Uid, student2Uid]) {
        if (student) {
          for (const schedule of scheduleData) {
            await db.collection('schedule').doc().set({
              uid: student,
              ...schedule,
              createdAt: firebase.firestore.Timestamp.now()
            });
          }
        }
      }

      if (teacherUid) {
        for (const schedule of scheduleData) {
          await db.collection('schedule').doc().set({
            uid: teacherUid,
            ...schedule,
            createdAt: firebase.firestore.Timestamp.now()
          });
        }
      }

      results.success.push(`✓ Dars jadvali yaratildi`);
    } catch (error) {
      console.error('[SeedData] Error creating schedule:', error);
      results.failed.push(`✗ Dars jadvali: ${error.message}`);
    }

    // STEP 4: Create grades
    if (onProgress) onProgress('Baholar yaratilmoqda...', 60);
    try {
      console.log('[SeedData] Creating grades...');
      const gradesData = [
        { type: 'midterm', score: 90, maxScore: 100, status: 'baholandi' },
        { type: 'final', score: 85, maxScore: 100, status: 'baholandi' },
        { type: 'assignment', score: 95, maxScore: 100, status: 'baholandi' }
      ];

      for (const student of [student1Uid, student2Uid]) {
        if (student) {
          for (let i = 0; i < this.courseData.length; i++) {
            for (const grade of gradesData) {
              await db.collection('grades').doc().set({
                studentId: student,
                uid: teacherUid,
                courseName: this.courseData[i].name,
                ...grade,
                date: new Date(2026, 4, Math.floor(Math.random() * 26) + 1).toISOString().split('T')[0],
                createdAt: firebase.firestore.Timestamp.now()
              });
            }
          }
        }
      }

      results.success.push(`✓ Baholar yaratildi`);
    } catch (error) {
      console.error('[SeedData] Error creating grades:', error);
      results.failed.push(`✗ Baholar: ${error.message}`);
    }

    // STEP 5: Create groups
    if (onProgress) onProgress('Guruhlar yaratilmoqda...', 70);
    try {
      console.log('[SeedData] Creating groups...');
      const groups = [
        { name: 'KI-31', faculty: 'Kompyuter injiniringi', students: [student1Uid, student2Uid].filter(x => x) },
        { name: 'KI-32', faculty: 'Kompyuter injiniringi', students: [] }
      ];

      for (const group of groups) {
        await db.collection('groups').doc().set({
          uid: teacherUid,
          ...group,
          createdAt: firebase.firestore.Timestamp.now()
        });
      }

      results.success.push(`✓ ${groups.length} ta guruh yaratildi`);
    } catch (error) {
      console.error('[SeedData] Error creating groups:', error);
      results.failed.push(`✗ Guruhlar: ${error.message}`);
    }

    // STEP 6: Create attendance
    if (onProgress) onProgress('Davomat qaydlari yaratilmoqda...', 80);
    try {
      console.log('[SeedData] Creating attendance...');

      for (const student of [student1Uid, student2Uid]) {
        if (student) {
          for (let day = 25; day <= 31; day++) {
            const status = Math.random() > 0.15 ? 'keldi' : 'kelmadi';
            await db.collection('attendance').doc().set({
              uid: teacherUid,
              studentId: student,
              status,
              date: new Date(2026, 4, day).toISOString().split('T')[0],
              createdAt: firebase.firestore.Timestamp.now()
            });
          }
        }
      }

      results.success.push(`✓ Davomat qaydlari yaratildi`);
    } catch (error) {
      console.error('[SeedData] Error creating attendance:', error);
      results.failed.push(`✗ Davomat: ${error.message}`);
    }

    // STEP 7: Create notifications
    if (onProgress) onProgress('Bildirishnomalar yaratilmoqda...', 85);
    try {
      console.log('[SeedData] Creating notifications...');
      const notifications = [
        { title: 'Yangi topshiriq', body: 'Veb dasturlash fanida yangi topshiriq qo\'shildi', isRead: false },
        { title: 'Baho qo\'yildi', body: 'Algoritmlar nazariyasi fani bo\'yicha baho qo\'yildi', isRead: false },
        { title: 'Davomat qayd qilindi', body: 'Bugungi davomat qayd qilindi', isRead: true }
      ];

      for (const student of [student1Uid, student2Uid]) {
        if (student) {
          for (const notif of notifications) {
            await db.collection('notifications').doc().set({
              uid: student,
              ...notif,
              time: new Date().toISOString(),
              createdAt: firebase.firestore.Timestamp.now()
            });
          }
        }
      }

      results.success.push(`✓ Bildirishnomalar yaratildi`);
    } catch (error) {
      console.error('[SeedData] Error creating notifications:', error);
      results.failed.push(`✗ Bildirishnomalar: ${error.message}`);
    }

    // STEP 8: Create tasks
    if (onProgress) onProgress('Topshiriqlar yaratilmoqda...', 90);
    try {
      console.log('[SeedData] Creating tasks...');
      const tasks = [
        { title: 'Algoritm yozish', courseName: 'Algoritmlar nazariyasi', dueDate: '2026-06-05', isDone: false, priority: 'yuqori' },
        { title: 'Database schema', courseName: "Ma'lumotlar bazasi", dueDate: '2026-06-07', isDone: true, priority: "o'rta" },
        { title: 'CSS styling', courseName: 'Veb dasturlash', dueDate: '2026-06-03', isDone: false, priority: 'yuqori' }
      ];

      for (const student of [student1Uid, student2Uid]) {
        if (student) {
          for (const task of tasks) {
            await db.collection('tasks').doc().set({
              uid: student,
              ...task,
              createdAt: firebase.firestore.Timestamp.now()
            });
          }
        }
      }

      results.success.push(`✓ Topshiriqlar yaratildi`);
    } catch (error) {
      console.error('[SeedData] Error creating tasks:', error);
      results.failed.push(`✗ Topshiriqlar: ${error.message}`);
    }

    // STEP 9: Create contracts
    if (onProgress) onProgress('Shartnomalar yaratilmoqda...', 95);
    try {
      console.log('[SeedData] Creating contracts...');
      const contracts = [
        {
          studentId: student1Uid,
          semester: 6,
          totalAmount: 5000000,
          paidAmount: 4500000,
          remainingAmount: 500000,
          dueDate: '2026-06-30',
          status: 'to\'liq to\'lanmagan',
          payments: [
            { amount: 2500000, date: '2026-05-01', status: 'to\'landi' },
            { amount: 2000000, date: '2026-05-15', status: 'to\'landi' }
          ]
        },
        {
          studentId: student2Uid,
          semester: 6,
          totalAmount: 5000000,
          paidAmount: 5000000,
          remainingAmount: 0,
          dueDate: '2026-06-30',
          status: "to'liq to'landi",
          payments: [
            { amount: 2500000, date: '2026-05-01', status: 'to\'landi' },
            { amount: 2500000, date: '2026-05-10', status: 'to\'landi' }
          ]
        }
      ];

      for (const contract of contracts) {
        await db.collection('contracts').doc().set({
          uid: contract.studentId,
          ...contract,
          createdAt: firebase.firestore.Timestamp.now()
        });
      }

      results.success.push(`✓ Shartnomalar yaratildi`);
    } catch (error) {
      console.error('[SeedData] Error creating contracts:', error);
      results.failed.push(`✗ Shartnomalar: ${error.message}`);
    }

    if (onProgress) onProgress('Tayyor! ✅', 100);
    console.log('[SeedData] Seeding complete. Success:', results.success.length, 'Failed:', results.failed.length);
    console.log('[SeedData] Results:', results);
    return results;
  }
};

window.SeedData_v2 = window.SeedData;
console.log('[seed-complete.js] SeedData initialized');
