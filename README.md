# EduManage Mobile — PWA Ta'lim Boshqaruv Tizimi

## Tavsif

**Uzbekcha:** EduManage Mobile — talabalar, o'qituvchilar va administratorlar uchun universal ta'lim boshqaruv tizimi. Taqadim etilgan PWA (Progressive Web App) platformasi mobil qurilmalarda va veb-brauzerda bemalol ishlaydi, oflayn rejimida ham ma'lumotlarga kirish imkonini beradi. Firestore vositasida realliq vaqtda ma'lumot sinkronizatsiyasi va Firebase autentifikatsiyasi orqali xavfsiz foydalanuvchi boshqaruvini ta'minlaydi.

**English:** EduManage Mobile is a comprehensive educational management system for students, teachers, and administrators. Built as a PWA (Progressive Web App), it runs seamlessly on mobile devices and web browsers, with offline access to data. Real-time synchronization via Firestore and secure user management through Firebase authentication ensure smooth operation.

## Texnologik Stack

- **Frontend:** HTML5/CSS3/Vanilla JavaScript
- **Authentication:** Firebase Authentication (Email/Password)
- **Database:** Cloud Firestore
- **Hosting:** Firebase Hosting
- **Cloud Functions:** Firebase Cloud Functions (Node.js)
- **PWA:** Service Worker for offline support
- **Reporting:** SheetJS (Excel), jsPDF (PDF generation)

## Rol-Asosiy Tizim

EduManage uch turli foydalanuvchi rolini qo'llab-quvvatlaydi:

### Admin (Administrator)
- Foydalanuvchi rollarini o'zgartirishga ruxsat
- Davomat ma'lumotlarini o'zgartirishga ruxsat
- Baholar va shartnomalarni o'zgartirishga ruxsat
- To'lovlar va shartnomalarni boshqarishga ruxsat
- Tizimning barcha ma'lumotlariga kirish huquqi

### O'qituvchi (Teacher)
- Davomat qaydlarini yaratishga ruxsat
- Talabalar baholarini kiritsishga ruxsat
- O'zining talabalarining baholarini ko'rishga ruxsat
- Guruhlardagi talabalarning dars jadvalidlarini ko'rishga ruxsat
- Guruh uchun hisobotlar yaratishga ruxsat

### Talaba (Student)
- Shaxsiy baholargina ko'rishga ruxsat
- Dars jadvalidini ko'rishga ruxsat
- O'zining davomat foizini ko'rishga ruxsat
- Shaxsiy shartnomani ko'rishga ruxsat
- O'zining to'lovlarini ko'rishga ruxsat

## O'rnatish Ko'rsatmalari

### 1. Depo klonlash
```bash
git clone <repository-url>
cd EduManage
```

### 2. Firebase loyihasi yaratish
- [Firebase Console](https://console.firebase.google.com) saytiga o'ting
- Yangi loyiha yaratish tugmasini bosing
- Loyihaga nom bering (masalan: "edumanage-c803c")

### 3. Firestore Database o'rnatish
- Firebase konsolida "Firestore Database" bo'limiga o'ting
- "Create Database" tugmasini bosing
- Boshlang'ich rejim ("Start in test mode") tanlanadi
- "Start Collection" tugmasini bosing va "users" yig'indisini yarating

### 4. Authentication o'rnatish
- Firebase konsolida "Authentication" bo'limiga o'ting
- "Get Started" tugmasini bosing
- "Email/Password" usulini faollashtiring
- "Email link (passwordless sign-in)" o'chirib qo'ying

### 5. Firebase konfiguratsiyani o'rnatish
- Firebase konsolida proyekt sozlamalari ("Project Settings") bo'limiga o'ting
- Veb-ilova uchun config ma'lumotlarini nusxalang
- [firebase-config.js](firebase-config.js) faylini o'ching va konfiguratsiyani o'rnating:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 6. Loyiha ID'ni o'zgartiringiz
- [.firebaserc](.firebaserc) faylini o'ching
- "your-project-id" ni haqiqiy loyiha ID'siga almashtiring:
```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 7. Firebase CLI o'rnatish
```bash
npm install -g firebase-tools
firebase login
```

### 8. Firestore qoidalarini joylashtirish
```bash
firebase deploy --only firestore:rules
```

### 9. Hosting joylashtirish
```bash
firebase deploy --only hosting
```

### 10. Cloud Functions joylashtirish
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## PWA O'rnatish

### Android'da o'rnatish
1. EduManage PWA veb-saytini brauzeringizda oching
2. Brauzer menyusida (⋮) "Ushbu saytni bosh ekranga qo'sh" ("Add to Home Screen") tugmasini bosing
3. Nomni tasdiqlang va "Qo'shish" tugmasini bosing
4. Ilovalar ekranida EduManage ikonkasi paydo bo'ladi

### iOS'da o'rnatish
1. Safari brauzerida veb-saytni oching
2. Ulashing tugmasini (bagua ikoni) bosing
3. "Bosh ekranga qo'sh" ("Add to Home Screen") tanlanadi
4. Nomni tasdiqlang va "Qo'shish" tugmasini bosing
5. Ilovalar ekranida EduManage ikonkasi paydo bo'ladi

## Oflayn Rejimi

EduManage PWA Service Worker vositasida quyidagi funksiyalarni oflayn rejimida qo'llab-quvvatlaydi:

**Oflayn qo'llaniladigan:**
- Dashboard va talabaning shaxsiy ma'lumotlarini ko'rish
- Dars jadvalidini ko'rish
- Baholarga kirish (ohirgi yuklab olingan ma'lumotlar)
- Davomat qaydlarini ko'rish (ohirgi yuklab olingan)

**Sinkronizatsiya:**
- Ulanish tiklangach, barcha o'zgartirilgan ma'lumotlar avtomatik ravishda Firestore ga yuboriladi
- Yangi ma'lumotlar internetda yuklab olinadi
- Konfiksiyoni hal qilish uchun server ma'lumotlari birinchi qabul qilinadi

## Test Hisoblar

Quyidagi test hisoblarni foydalanish:

| Email | Parol | Rol | Maqsadi |
|-------|-------|-----|--------|
| admin@edumanage.com | Admin@2025 | Admin | Tizim boshqaruvchisi |
| teacher@edumanage.com | Teacher@2025 | O'qituvchi | Dars o'tkazontvchi |
| student1@edumanage.com | Student@2025 | Talaba | Talaba (test 1) |
| student2@edumanage.com | Student@2025 | Talaba | Talaba (test 2) |

### Test ma'lumotlarini yuklab olish
Firestore'ni test ma'lumotlari bilan to'ldirish uchun:
```bash
# Brauzer konsolida (index.html ochildi):
await MockDB.seedDatabase();
```

Yoki [seed.js](seed.js) faylini tekshiring va kerakli o'zgartirishlarni qiling.

## Tasdiqnomani olish (License)

Bu loyiha MIT tasdiqnomasida chiqarilgan. Batafsil ma'lumot uchun [LICENSE](LICENSE) faylini ko'ring.

---

## Mualliflar va Hissa Qo'shuvchilar

Ushbu loyiha akademik dissertatsiya asosida yaratilgan.

**Oxirgi yangilanish:** 2026-yil may oyi
