const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// Function 1 - setUserRole: an HTTPS callable function
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = context.auth.uid;
  const { uid, role } = data;

  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and role are required');
  }

  try {
    // Check if caller is admin
    const callerDoc = await db.collection('users').doc(callerUid).get();
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can set user roles');
    }

    // Set custom user claims with role
    await admin.auth().setCustomUserClaims(uid, { role });

    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    if (error.code && error.code.startsWith('auth/')) {
      throw new functions.https.HttpsError('internal', 'Failed to set user role');
    }
    throw error;
  }
});

// Function 2 - recalculateGPA: Firestore trigger on grades/{gradeId} onWrite
exports.recalculateGPA = functions.firestore
  .document('grades/{gradeId}')
  .onWrite(async (change, context) => {
    try {
      const gradeData = change.after.data();
      if (!gradeData || !gradeData.studentId) {
        console.log('Grade has no studentId, skipping GPA calculation');
        return;
      }

      const studentId = gradeData.studentId;

      // Fetch all grades for the student
      const gradesSnapshot = await db
        .collection('grades')
        .where('studentId', '==', studentId)
        .get();

      if (gradesSnapshot.empty) {
        console.log('No grades found for student:', studentId);
        return;
      }

      const grades = gradesSnapshot.docs.map(doc => doc.data());

      // Calculate GPA with weighted average or arithmetic mean
      let totalWeightedScore = 0;
      let totalCredits = 0;
      let simpleSum = 0;

      grades.forEach(grade => {
        const score = grade.score || 0;
        const credits = grade.credits;

        if (credits && !isNaN(credits) && credits > 0) {
          // Weighted average
          totalWeightedScore += score * credits;
          totalCredits += credits;
        } else {
          // Simple arithmetic mean fallback
          simpleSum += score;
        }
      });

      let gpaLocal; // 5-point Uzbekistan scale
      let gpa; // 4.0 international scale

      if (totalCredits > 0) {
        const weightedAverage = totalWeightedScore / totalCredits;
        // Convert to 5-point Uzbekistan scale
        if (weightedAverage >= 86) gpaLocal = 5;
        else if (weightedAverage >= 71) gpaLocal = 4;
        else if (weightedAverage >= 56) gpaLocal = 3;
        else if (weightedAverage >= 41) gpaLocal = 2;
        else gpaLocal = 1;

        // Convert to 4.0 international scale
        if (weightedAverage >= 86) gpa = 4.0;
        else if (weightedAverage >= 71) gpa = 3.0;
        else if (weightedAverage >= 56) gpa = 2.0;
        else gpa = 0.0;
      } else {
        // Arithmetic mean fallback
        const arithmeticMean = simpleSum / grades.length;

        // Convert to 5-point Uzbekistan scale
        if (arithmeticMean >= 86) gpaLocal = 5;
        else if (arithmeticMean >= 71) gpaLocal = 4;
        else if (arithmeticMean >= 56) gpaLocal = 3;
        else if (arithmeticMean >= 41) gpaLocal = 2;
        else gpaLocal = 1;

        // Convert to 4.0 international scale
        if (arithmeticMean >= 86) gpa = 4.0;
        else if (arithmeticMean >= 71) gpa = 3.0;
        else if (arithmeticMean >= 56) gpa = 2.0;
        else gpa = 0.0;
      }

      // Update user document with GPA values
      await db.collection('users').doc(studentId).update({
        gpa,
        gpaLocal,
        gpaUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`GPA recalculated for student ${studentId}: gpa=${gpa}, gpaLocal=${gpaLocal}`);
    } catch (error) {
      console.error('Error in recalculateGPA:', error);
    }
  });

// Function 3 - sendGradeNotification: Firestore trigger on grades/{gradeId} onCreate
exports.sendGradeNotification = functions.firestore
  .document('grades/{gradeId}')
  .onCreate(async (snap, context) => {
    try {
      const gradeData = snap.data();
      if (!gradeData || !gradeData.studentId) {
        console.log('Grade has no studentId, skipping notification');
        return;
      }

      const studentId = gradeData.studentId;
      const courseName = gradeData.courseName || 'Fani';
      const score = gradeData.score || 0;

      // Get student's FCM token from users document
      const userDoc = await db.collection('users').doc(studentId).get();
      if (!userDoc.exists || !userDoc.data().fcmToken) {
        console.log('Student has no FCM token:', studentId);
        return;
      }

      const fcmToken = userDoc.data().fcmToken;

      // Send push notification via Firebase Cloud Messaging
      const message = {
        notification: {
          title: 'Yangi baho!',
          body: `${courseName}: ${score}`
        },
        token: fcmToken
      };

      await admin.messaging().send(message);
      console.log(`Notification sent to student ${studentId}`);
    } catch (error) {
      // Log error silently - don't crash if token is missing or message fails
      console.log('Error sending grade notification:', error.message);
    }
  });
