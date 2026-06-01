# EduManage Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### Step 1: Deploy Firestore Rules
```
1. Firebase Console → edumanage-c803c
2. Firestore Database → Rules tab
3. Delete all, paste from: firestore.rules file
4. Click "Publish"
```

### Step 2: Start Live Server
```
1. Open EduManage folder in VS Code
2. Right-click index.html
3. Select "Open with Live Server"
4. Opens at: http://localhost:5500
```

### Step 3: Test First Login (Triggers Seeding)
```
Email: student1@edumanage.com
Password: Student@2025

⏳ Wait 3-5 seconds for seeding
✅ Auto-login after seed complete
```

---

## 📱 Test All 3 Roles

### 🎓 Student
- Email: `student1@edumanage.com` / Password: `Student@2025`
- See: GPA 3.72, Attendance 94%, 5 Courses, Schedule, Grades, Notifications

### 👨‍🏫 Teacher
- Email: `teacher@edumanage.com` / Password: `Teacher@2025`
- Do: View groups, mark attendance, enter grades

### 👨‍💼 Admin
- Email: `admin@edumanage.com` / Password: `Admin@2025`
- See: All users, all courses, statistics

---

## 🔍 Check Browser Console (F12)
```
[SeedData] Starting comprehensive seeding...
[SeedData] Creating user: ...
[SeedData] Seeding complete. Success: 9 Failed: 0
[Auth] login success after seeding, role: talaba
```

---

## ✅ What Got Fixed

| Issue | Fix |
|-------|-----|
| Empty Firestore | Comprehensive seed-complete.js with all collections |
| Missing DB functions | Added getContract(), getAllUsers() |
| Role-based queries broken | Fixed getGrades() with studentId vs uid |
| Auth functions missing | Added async getAllUsers() |
| Firestore rules blocking writes | Updated rules with proper role access |
| Seeding wasn't working | Added auto-seed on first test account login |

---

## 📊 Firestore Collections Created

1. ✅ **users** (4 accounts)
2. ✅ **courses** (5 courses)
3. ✅ **schedule** (5 class times × 3 people)
4. ✅ **grades** (multiple grades per student)
5. ✅ **groups** (2 groups)
6. ✅ **attendance** (7 days per student)
7. ✅ **notifications** (3 per student)
8. ✅ **tasks** (3 per student)
9. ✅ **contracts** (1 per student)

---

## 💾 Files Modified

```
✏️  seed-complete.js (NEW) - Comprehensive seeding
✏️  index.html - Added script import
✏️  db.js - Added functions, fixed queries
✏️  auth.js - Added async getAllUsers()
✏️  firestore.rules - Updated security rules
```

---

## 🎯 Next: Test the Seeding Process

1. Hard refresh browser (Ctrl+F5)
2. Enter: `student1@edumanage.com`
3. Password: `Student@2025`
4. Click **Kirish**
5. Watch console for seeding logs
6. Wait for auto-login
7. Dashboard should show student data ✅

---

## 🆘 If Login Still Fails

**Check 1**: Firestore rules deployed?
- Go to Firebase Console → Firestore → Rules
- Verify rules are there and published

**Check 2**: Browser console shows errors?
- F12 → Console tab
- Look for [SeedData] or [Auth] logs
- Screenshot error and check REPAIR_SUMMARY.md

**Check 3**: Need to clear cache?
- F12 → Application → Clear Storage
- Refresh page
- Try login again

---

## 📧 Test Accounts (Auto-created on First Login)

```
Admin         | admin@edumanage.com         | Admin@2025
Teacher       | teacher@edumanage.com       | Teacher@2025
Student 1     | student1@edumanage.com      | Student@2025
Student 2     | student2@edumanage.com      | Student@2025
```

---

## ✨ Seeding Workflow

```
Login → Not found (normal) → Detect test account → Seed DB → Auto-retry → Success!
        ↓
    2 second wait for Firebase propagation
```

---

## 📞 Key Files Documentation

**seed-complete.js**
- 9 collections worth of data
- Uses Firestore Client SDK
- Auto-runs on first test account login
- See: testAccounts, courseData, run()

**db.js**
- MockDB.getGrades() - role-aware filtering
- MockDB.getContract() - gets student contract
- MockDB.getAllUsers() - all users list

**firestore.rules**
- Students: read own grades, contracts, tasks
- Teachers: manage grades, attendance, groups
- Admins: full access

---

## 🎉 Success Indicators

- ✅ Student dashboard shows GPA & attendance
- ✅ "Fanlar" tab shows 5 courses
- ✅ "Dars jadvali" shows schedule
- ✅ "Baholar" tab shows grades
- ✅ Notifications appear in bell icon
- ✅ Teacher can see groups
- ✅ Admin can see all users

**Everything working?** 🎊 Project is ready!
