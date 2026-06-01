# Technical Implementation Details

## Database Structure Changes

### 1. seed-complete.js (New File)

**Purpose**: Comprehensive Firestore seeding system

**Key Components**:
- `testAccounts` array - 4 accounts with full metadata
- `courseData` array - 5 courses with teacher association
- `run()` async function - Creates 9 collections in stages

**Collections Created**:

1. **users**
   - UID as document ID
   - Role-specific fields (gpa for students, subject for teachers)
   - avatarColor for UI personalization

2. **courses**
   - Associated with teacher UID
   - Includes: name, credits, room, color, progress, currentGrade
   - 5 specific courses for Computer Science program

3. **schedule**
   - One per user (students & teacher)
   - Fields: uid, subject, day, startTime, endTime, room, type, teacherName
   - 5 class times daily

4. **grades**
   - Dual ownership: studentId + uid (teacher)
   - Types: midterm, final, assignment
   - Date tracking for history

5. **groups**
   - Teacher-owned (uid field)
   - Students array contains student UIDs
   - 2 groups: KI-31, KI-32

6. **attendance**
   - Teacher-owned with studentId reference
   - Status: keldi, kelmadi, kech
   - 7 days of records

7. **notifications**
   - Student-owned (uid = student UID)
   - isRead flag for tracking
   - timestamp for sorting

8. **tasks**
   - Student-owned (uid = student UID)
   - Priority-based: yuqori, o'rta, past
   - dueDate for deadline tracking

9. **contracts**
   - Dual UID: studentId for reading, uid for access control
   - Payment history with individual transactions
   - Semester tracking

---

## db.js Changes

### New Helper Function
```javascript
const getUserRole = () => {
    const raw = sessionStorage.getItem('edu-session');
    if (!raw) return null;
    try {
        return JSON.parse(raw).role;
    } catch {
        return null;
    }
};
```

### Fixed getGrades() Function
**Before**: Always filtered by `where('uid', '==', uid)`
**After**: 
```javascript
if (role === 'talaba') {
    query = query.where('studentId', '==', uid);  // Students see their grades
} else {
    query = query.where('uid', '==', uid);  // Teachers see their grades
}
```

### New Functions Added

**getContract()**
```javascript
// Fetch student's contract by studentId
// Only students have one contract per semester
// Returns: contract document or null
```

**getAllUsers()**
```javascript
// Fetch entire users collection
// Admin dashboard uses this
// Returns: array of all user documents
```

**getAllContracts()**
```javascript
// Fetch all contracts from collection
// Admin reporting uses this
// Returns: array of all contract documents
```

---

## auth.js Changes

### New Function: getAllUsers()
```javascript
Auth.getAllUsers = async function() {
    try {
        if (!firebase || !firebase.firestore) return [];
        const snapshot = await firebase.firestore().collection('users').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('[Auth] Error fetching all users:', error);
        return [];
    }
};
```

### Placeholder Functions
- `Auth.addUser()` - Logs operation, returns success
- `Auth.deleteUser()` - Logs operation, returns success
- `Auth.bulkCreate()` - Logs operation, returns success

**Purpose**: Provide interface for admin user management (expandable)

---

## firestore.rules Changes

### Security Model

**Role Detection**:
```javascript
function isAdmin() {
  return request.auth != null && 
    get(...users/{uid}).data.role == 'admin';
}

function isTeacher() {
  return request.auth != null && 
    get(...users/{uid}).data.role == 'oquvchi';
}

function isStudent() {
  return request.auth != null && 
    get(...users/{uid}).data.role == 'talaba';
}
```

**Collection-Level Access**:

| Collection | Read | Write | Notes |
|-----------|------|-------|-------|
| users | All authenticated | Own + Admin | Can't modify others |
| schedule | Own data | Teacher + Admin | Students see own schedule |
| grades | Own/Student | Teacher + Admin | Strict access control |
| attendance | Own/Student | Teacher + Admin | Marking is privileged |
| contracts | Own/Admin | Admin only | Payment records protected |
| groups | All authenticated | Teacher + Admin | Curriculum planning |
| courses | All authenticated | Teacher + Admin | Subject catalog |
| notifications | Own | Own + Admin | Personal messages |
| tasks | Own | Own | Personal to-do lists |

---

## Login Flow with Seeding

### Sequence

```
1. User enters: student1@edumanage.com / Student@2025

2. Auth.login() attempts Firebase auth

3. Gets error: auth/user-not-found OR auth/invalid-credential

4. Checks if email in TEST_ACCOUNTS list

5. Calls Auth.ensureSeededIfTestAccount()

6. SeedData.run() executes:
   - Creates 4 Firebase Auth users
   - Writes 9 Firestore collections
   - Logs progress via onProgress callback
   - Returns results: { success: [...], failed: [...] }

7. Waits 2 seconds for Firestore propagation

8. Retries Auth.login()

9. Success! User logged in, session stored
```

### Error Handling

**If seeding fails**:
- Caught in try/catch block
- Error logged to console with [SeedData] prefix
- Returned in `results.failed` array
- User sees error message

**If second login attempt fails**:
- Normal "Email yoki parol noto'g'ri" error shown
- User can try again
- Check browser console for details

---

## index.html Script Load Order

**Critical**: Scripts must load in this order:

1. Firebase SDK imports (3 scripts from CDN)
2. `firebase-config.js` - Initialize Firebase
3. Phosphor icons CDN
4. XLSX library (Excel support)
5. **`auth.js`** - Authentication setup
6. **`db.js`** - Database layer
7. **`seed.js`** - Original seeding (backup)
8. **`seed-complete.js`** - New comprehensive seeding
9. **`app.js`** - UI rendering (depends on above)
10. PDF libraries (jsPDF for reporting)

---

## Data Flow Architecture

```
┌─────────────────────────────────────┐
│  User Login                         │
│  (email/password)                   │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  auth.js                            │
│  - Authenticate with Firebase Auth  │
│  - Check if test account            │
│  - Trigger seeding if needed        │
└────────────┬────────────────────────┘
             │
             ↓
        ┌────────────────────┐
        │ Seeding Required?  │
        └────┬────────┬──────┘
      Yes    │        │    No
             ↓        │
      ┌──────────┐    │
      │seed.js   │    │
      │seed-     │    │
      │complete  │    │
      └────┬─────┘    │
           │          │
           ↓          ↓
┌─────────────────────────────────────┐
│  Firestore Collections              │
│  (users, courses, grades, etc.)     │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  db.js (MockDB)                     │
│  - Query collections by role        │
│  - Filter: students vs teachers     │
│  - Return data to UI                │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  app.js                             │
│  - Render dashboard by role         │
│  - Handle navigation                │
│  - Update UI with data              │
└─────────────────────────────────────┘
```

---

## Seeding Progress Indicators

The `onProgress` callback tracks:

```
0-20%   → Creating users (4 accounts)
20-30%  → Creating courses (5 courses)
30-45%  → Creating schedules (5 times × users)
45-60%  → Creating grades (multiple per course)
60-70%  → Creating groups (2 groups)
70-80%  → Creating attendance (7 days)
80-85%  → Creating notifications (3 per user)
85-90%  → Creating tasks (3 per user)
90-95%  → Creating contracts (2 contracts)
95-100% → Complete ✅
```

---

## Error Prevention Features

### 1. Null Safety
```javascript
// Checks before accessing role
function isAdmin() {
  return request.auth != null && 
    get(...).data.role == 'admin';
}
```

### 2. Try-Catch Wrapping
```javascript
try {
    // Seeding operation
} catch (error) {
    console.error('[SeedData] Error:', error);
    results.failed.push(`✗ ${error.message}`);
}
```

### 3. Validation
```javascript
// Check Firebase loaded before seeding
if (!firebase || !firebase.auth || !firebase.firestore) {
    return results;
}
```

### 4. Email Lowercasing
```javascript
const cleanEmail = email.trim().toLowerCase();
// Prevents case sensitivity issues
```

### 5. Timestamp Consistency
```javascript
firebase.firestore.Timestamp.now()
// Instead of new Date() for consistency
```

---

## Testing Hooks

### Console Logging Tags
- `[Auth]` - Authentication operations
- `[SeedData]` - Seeding progress
- `[MockDB]` - Database queries
- `[Firebase]` - Firebase initialization

### Progress Display
- Seeding shows progress bar in UI
- Each step logs to console
- Results array tracks success/failure

### Debug Information
```javascript
console.log('[SeedData] Seeding complete.');
console.log('[SeedData] Success:', results.success.length);
console.log('[SeedData] Failed:', results.failed.length);
console.log('[SeedData] Results:', results);
```

---

## Performance Considerations

### Async Operations
- All Firestore writes use `await`
- Parallel operations where possible
- Sequential for dependency

### Storage Efficiency
- No duplicate writes
- Merge operations prevent overwrites
- One seed per browser session

### Network Optimization
- Batch operations in loops
- Minimal query filtering
- Indexes not required for simple queries

---

## Future Enhancement Points

1. **Admin Dashboard Async** - Make renderAdminDashboard async
2. **Contract Page UI** - Implement payment history page
3. **Real-time Listeners** - Add Firestore onSnapshot listeners
4. **Offline Support** - Enhanced PWA offline-first mode
5. **File Uploads** - Student document/assignment uploads
6. **Email Integration** - Firebase Cloud Messaging
7. **Report Generation** - More export formats (CSV, JSON)
8. **User Management** - Admin panel for user CRUD

---

## Deployment Checklist

- [x] Firestore collections created
- [x] Security rules deployed
- [x] Test accounts functional
- [x] Seeding on first login works
- [x] Role-based access working
- [x] UI renders correctly
- [x] Console logging for debugging
- [x] Error handling implemented
- [x] Documentation complete

**Status**: ✅ Ready for testing and deployment
