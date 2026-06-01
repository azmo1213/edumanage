// seed.js — Firestore test data seeding
window.SeedData = {
  // Test accounts to create
  testAccounts: [
    {
      email: 'admin@edumanage.com',
      password: 'Admin@2025',
      role: 'admin',
      fullName: 'Admin Foydalanuvchi',
      faculty: 'Administration'
    },
    {
      email: 'teacher@edumanage.com',
      password: 'Teacher@2025',
      role: 'oquvchi',
      fullName: 'Ali O\'qituvchi',
      faculty: 'Computer Science'
    },
    {
      email: 'student1@edumanage.com',
      password: 'Student@2025',
      role: 'talaba',
      fullName: 'Alisher Nurmatov',
      group: 'CS-401',
      faculty: 'Computer Science'
    },
    {
      email: 'student2@edumanage.com',
      password: 'Student@2025',
      role: 'talaba',
      fullName: 'Zarina Shodmonova',
      group: 'CS-401',
      faculty: 'Computer Science'
    }
  ],

  run: async function(onProgress) {
    const results = { success: [], failed: [] };
    
    if (!firebase || !firebase.auth || !firebase.firestore) {
      console.error('Firebase not initialized');
      return results;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    console.log('[SeedData] Starting seeding...');

    // Create test accounts
    for (let i = 0; i < this.testAccounts.length; i++) {
      const account = this.testAccounts[i];
      try {
        if (onProgress) {
          onProgress(`${account.fullName} yaratilmoqda...`, Math.round((i / this.testAccounts.length) * 50));
        }

        // Check if user already exists
        let userCredential;
        try {
          console.log(`[SeedData] Creating user: ${account.email}`);
          userCredential = await auth.createUserWithEmailAndPassword(account.email, account.password);
          console.log(`[SeedData] User created: ${account.email}, uid: ${userCredential.user.uid}`);
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log(`[SeedData] User already exists: ${account.email}, signing in...`);
            // User already exists, sign in to get the uid
            userCredential = await auth.signInWithEmailAndPassword(account.email, account.password);
            console.log(`[SeedData] Signed in existing user: ${account.email}, uid: ${userCredential.user.uid}`);
          } else {
            throw authError;
          }
        }

        const uid = userCredential.user.uid;

        // Create user document in Firestore
        const userData = {
          uid,
          email: account.email,
          role: account.role,
          fullName: account.fullName,
          faculty: account.faculty,
          createdAt: new Date(),
          gpa: 0,
          gpaLocal: 0,
          attendancePercent: 100
        };

        if (account.group) {
          userData.group = account.group;
          userData.completedCredits = 45;
          userData.totalCredits = 120;
        }

        console.log(`[SeedData] Writing Firestore document for ${uid}...`);
        await db.collection('users').doc(uid).set(userData, { merge: true });
        console.log(`[SeedData] Firestore document created for ${account.email}`);
        results.success.push(`✓ ${account.fullName} (${account.role})`);
      } catch (error) {
        console.error(`[SeedData] Error for ${account.email}:`, error);
        results.failed.push(`✗ ${account.fullName}: ${error.message}`);
      }
    }

    // Create sample courses
    if (onProgress) onProgress('Fanlar yaratilmoqda...', 60);
    const courses = [
      { name: 'Web Development', credits: 3, description: 'Modern web development with HTML, CSS, JS' },
      { name: 'Database Design', credits: 3, description: 'SQL and NoSQL database design' },
      { name: 'Cloud Computing', credits: 3, description: 'Firebase and cloud infrastructure' }
    ];

    try {
      const teacherDoc = await db.collection('users').where('role', '==', 'oquvchi').limit(1).get();
      if (!teacherDoc.empty) {
        const teacherUid = teacherDoc.docs[0].id;
        for (const course of courses) {
          await db.collection('courses').doc(`course_${Date.now()}_${Math.random()}`).set({
            ...course,
            uid: teacherUid,
            createdAt: new Date()
          });
        }
        results.success.push(`✓ ${courses.length} ta fan yaratildi`);
      }
    } catch (error) {
      results.failed.push(`✗ Fanlar yaratilishi xatolik: ${error.message}`);
    }

    // Create sample grades for students
    if (onProgress) onProgress('Baholar yaratilmoqda...', 75);
    try {
      const studentsDoc = await db.collection('users').where('role', '==', 'talaba').get();
      const coursesDoc = await db.collection('courses').limit(3).get();

      const grades = [
        { score: 95, maxScore: 100, type: 'midterm', status: 'baholandi' },
        { score: 88, maxScore: 100, type: 'final', status: 'baholandi' },
        { score: 92, maxScore: 100, type: 'assignment', status: 'baholandi' }
      ];

      let gradeCount = 0;
      for (const studentDoc of studentsDoc.docs) {
        for (const courseDoc of coursesDoc.docs) {
          for (const gradeData of grades) {
            await db.collection('grades').doc(`grade_${Date.now()}_${Math.random()}`).set({
              studentId: studentDoc.id,
              courseName: courseDoc.data().name,
              courseId: courseDoc.id,
              ...gradeData,
              date: new Date(2026, 4, Math.floor(Math.random() * 26) + 1).toISOString().split('T')[0],
              uid: (await db.collection('users').where('role', '==', 'oquvchi').limit(1).get()).docs[0]?.id
            });
            gradeCount++;
          }
        }
      }
      results.success.push(`✓ ${gradeCount} ta baho yaratildi`);
    } catch (error) {
      results.failed.push(`✗ Baholar yaratilishi xatolik: ${error.message}`);
    }

    // Create sample attendance records
    if (onProgress) onProgress('Davomat qaydlari yaratilmoqda...', 85);
    try {
      const studentsDoc = await db.collection('users').where('role', '==', 'talaba').get();
      let attendanceCount = 0;

      for (const studentDoc of studentsDoc.docs) {
        const daysInMay = 22; // Working days
        for (let day = 1; day <= daysInMay; day++) {
          const isPresent = Math.random() > 0.15; // 85% attendance
          await db.collection('attendance').doc(`att_${Date.now()}_${Math.random()}`).set({
            studentId: studentDoc.id,
            status: isPresent ? 'present' : 'absent',
            date: new Date(2026, 4, day).toISOString().split('T')[0],
            uid: (await db.collection('users').where('role', '==', 'oquvchi').limit(1).get()).docs[0]?.id
          });
          attendanceCount++;
        }
      }
      results.success.push(`✓ ${attendanceCount} ta davomat qayd yaratildi`);
    } catch (error) {
      results.failed.push(`✗ Davomat qaydlari xatolik: ${error.message}`);
    }

    // Create sample schedule
    if (onProgress) onProgress('Dars jadvalini yaratilmoqda...', 92);
    try {
      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const timeslots = [
        { startTime: '08:00', endTime: '09:30' },
        { startTime: '09:45', endTime: '11:15' },
        { startTime: '12:00', endTime: '13:30' },
        { startTime: '14:00', endTime: '15:30' }
      ];

      const coursesDoc = await db.collection('courses').limit(3).get();
      const teacherDoc = await db.collection('users').where('role', '==', 'oquvchi').limit(1).get();

      let scheduleCount = 0;
      if (!teacherDoc.empty) {
        const teacherUid = teacherDoc.docs[0].id;
        for (const course of coursesDoc.docs) {
          const day = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];
          const slot = timeslots[Math.floor(Math.random() * timeslots.length)];
          
          await db.collection('schedule').doc(`sched_${Date.now()}_${Math.random()}`).set({
            courseId: course.id,
            courseName: course.data().name,
            day,
            room: `Room ${Math.floor(Math.random() * 10) + 101}`,
            ...slot,
            uid: teacherUid
          });
          scheduleCount++;
        }
      }
      results.success.push(`✓ ${scheduleCount} ta dars jadval yaratildi`);
    } catch (error) {
      results.failed.push(`✗ Dars jadval xatolik: ${error.message}`);
    }

    // Create sample contracts for students
    if (onProgress) onProgress('Shartnomalar yaratilmoqda...', 98);
    try {
      const studentsDoc = await db.collection('users').where('role', '==', 'talaba').get();
      let contractCount = 0;

      for (const studentDoc of studentsDoc.docs) {
        await db.collection('contracts').doc(`contract_${Date.now()}_${Math.random()}`).set({
          studentId: studentDoc.id,
          type: 'educational',
          status: 'active',
          startDate: new Date(2025, 8, 1).toISOString().split('T')[0],
          endDate: new Date(2026, 5, 30).toISOString().split('T')[0],
          createdAt: new Date()
        });
        contractCount++;
      }
      results.success.push(`✓ ${contractCount} ta shartnoma yaratildi`);
    } catch (error) {
      results.failed.push(`✗ Shartnomalar xatolik: ${error.message}`);
    }

    if (onProgress) onProgress('Tayyor!', 100);
    console.log('[SeedData] Seeding complete. Success:', results.success.length, 'Failed:', results.failed.length);
    console.log('[SeedData] Results:', results);
    return results;
  },

  // Helper function to clear all test data
  clear: async function(onProgress) {
    const results = { success: [], failed: [] };

    if (!firebase || !firebase.firestore) {
      console.error('Firebase not initialized');
      return results;
    }

    const db = firebase.firestore();
    const collections = ['courses', 'grades', 'attendance', 'schedule', 'contracts'];

    try {
      for (const collection of collections) {
        const snapshot = await db.collection(collection).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        results.success.push(`✓ ${collection} tozalandi`);
      }
    } catch (error) {
      results.failed.push(`✗ Tozalash xatolik: ${error.message}`);
    }

    return results;
  }
};