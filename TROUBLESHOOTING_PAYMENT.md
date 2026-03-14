# 🔧 Troubleshooting Payment System

## ❌ Error: "Tripay belum dikonfigurasi"

### Penyebab
`VITE_TRIPAY_APPS_SCRIPT_URL` belum di-set di file `.env`

### Solusi Lengkap

#### 1️⃣ Deploy Google Apps Script

1. **Buka Google Apps Script**
   - Kunjungi https://script.google.com
   - Klik "New Project"

2. **Copy Code**
   - Buka file `google-apps-script/TripayProxy.gs`
   - Copy seluruh kode ke Apps Script editor

3. **Setup Credentials**
   - Klik menu "Run" → Pilih function `setupScriptProperties`
   - Authorize aplikasi (pertama kali)
   - Cek log untuk memastikan berhasil

4. **Deploy sebagai Web App**
   - Klik "Deploy" → "New deployment"
   - Pilih type: "Web app"
   - Settings:
     - **Execute as**: Me (your email)
     - **Who has access**: Anyone
   - Klik "Deploy"
   - **COPY URL DEPLOYMENT** (format: `https://script.google.com/macros/s/XXXXXX/exec`)

#### 2️⃣ Set Environment Variable

1. **Buka file `.env`** di root project
2. **Tambahkan/Update baris berikut:**
   ```env
   VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXX/exec
   ```
   ⚠️ Ganti `XXXXXX` dengan deployment ID Anda

3. **Restart Dev Server**
   ```bash
   # Tekan Ctrl+C untuk stop server
   # Jalankan ulang:
   npm run dev
   ```

#### 3️⃣ Test Koneksi

**Cara 1: Menggunakan Test Tool**
1. Buka file `test-apps-script-connection.html` di browser
2. Paste URL Apps Script Anda
3. Klik "Test Koneksi"
4. Jika berhasil, klik "Test Payment Channels"

**Cara 2: Manual Test di Browser Console**
```javascript
// Test koneksi
const url = 'https://script.google.com/macros/s/XXXXXX/exec';
fetch(url + '?path=payment-channels')
  .then(res => res.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err));
```

---

## ❌ Error: "Missing or insufficient permissions"

### Penyebab
Firestore Rules belum dikonfigurasi dengan benar

### Solusi

1. **Buka Firebase Console**
   - https://console.firebase.google.com
   - Pilih project Anda
   - Klik "Firestore Database"
   - Tab "Rules"

2. **Update Firestore Rules**

   Paste rules berikut:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       // Helper function untuk check authenticated
       function isAuthenticated() {
         return request.auth != null;
       }

       // Helper function untuk check owner
       function isOwner(userId) {
         return isAuthenticated() && request.auth.uid == userId;
       }

       // Helper function untuk check admin
       function isAdmin() {
         return isAuthenticated() &&
                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }

       // Users collection
       match /users/{userId} {
         allow read: if isAuthenticated();
         allow create: if isAuthenticated();
         allow update: if isOwner(userId);
         allow delete: if isOwner(userId) || isAdmin();
       }

       // Tryout packages - semua user bisa baca
       match /tryoutPackages/{tryoutId} {
         allow read: if true; // Public read
         allow write: if isAdmin();
       }

       // Questions - hanya admin
       match /questions/{questionId} {
         allow read: if isAuthenticated();
         allow write: if isAdmin();
       }

       // User tryouts - user hanya bisa akses miliknya
       match /userTryouts/{tryoutId} {
         allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
         allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid;
         allow update: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
         allow delete: if isOwner(resource.data.userId) || isAdmin();
       }

       // Tryout sessions
       match /tryoutSessions/{sessionId} {
         allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
         allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid;
         allow update: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
         allow delete: if isOwner(resource.data.userId) || isAdmin();
       }

       // Payments
       match /payments/{paymentId} {
         allow read: if isAuthenticated() &&
                     resource.data.userId == request.auth.uid;
         allow create: if isAuthenticated() &&
                       request.resource.data.userId == request.auth.uid;
         allow update: if isAuthenticated() &&
                       resource.data.userId == request.auth.uid;
         allow delete: if isAdmin();
       }

       // Claim codes - admin only
       match /claimCodes/{codeId} {
         allow read: if isAuthenticated();
         allow write: if isAdmin();
       }

       // Rankings - public read, system write
       match /rankings/{rankingId} {
         allow read: if true;
         allow write: if isAuthenticated();
       }

       // Jabatan - public read
       match /jabatan/{jabatanId} {
         allow read: if true;
         allow write: if isAdmin();
       }
     }
   }
   ```

3. **Publish Rules**
   - Klik "Publish"
   - Tunggu beberapa detik untuk propagasi

---

## ✅ Checklist Troubleshooting

### Google Apps Script
- [ ] Script sudah di-deploy sebagai Web App
- [ ] "Who has access" set ke "Anyone"
- [ ] "Execute as" set ke "Me"
- [ ] Function `setupScriptProperties` sudah dijalankan
- [ ] URL deployment sudah di-copy dengan benar
- [ ] URL format: `https://script.google.com/macros/s/.../exec`

### Environment Variable
- [ ] File `.env` exists di root project
- [ ] `VITE_TRIPAY_APPS_SCRIPT_URL` sudah di-set
- [ ] Tidak ada spasi atau karakter aneh di URL
- [ ] Dev server sudah di-restart setelah update `.env`

### Firebase Rules
- [ ] Rules sudah di-update di Firebase Console
- [ ] Rules sudah di-publish
- [ ] User sudah login (authenticated)
- [ ] Tidak ada typo di collection names

### Test Koneksi
- [ ] `test-apps-script-connection.html` berjalan tanpa error
- [ ] Test "Payment Channels" berhasil
- [ ] Payment channels muncul di console

---

## 🔍 Debug Steps

### 1. Check Environment Variable
```bash
# Di terminal, jalankan:
echo $VITE_TRIPAY_APPS_SCRIPT_URL
```

Atau buka browser console dan ketik:
```javascript
console.log(import.meta.env.VITE_TRIPAY_APPS_SCRIPT_URL);
```

### 2. Check Apps Script Logs
1. Buka Apps Script editor
2. Klik "Executions" di sidebar
3. Lihat log untuk error

### 3. Check Browser Console
1. Buka DevTools (F12)
2. Tab "Console"
3. Lihat error messages
4. Tab "Network" untuk check request/response

### 4. Manual Test Apps Script
```bash
curl "https://script.google.com/macros/s/XXXXXX/exec?path=payment-channels"
```

---

## 📞 Masih Error?

Jika masih error setelah mengikuti semua langkah:

1. **Screenshot Error**
   - Browser console error
   - Apps Script logs
   - Firebase Rules

2. **Check Details**
   - URL Apps Script exact format
   - Environment: sandbox atau production?
   - Tripay credentials valid?

3. **Re-deploy**
   - Deploy ulang Apps Script
   - Gunakan URL deployment yang baru
   - Update di `.env`
   - Restart dev server

---

## 🎯 Quick Fix

Jika bingung, ikuti langkah ini:

1. **Deploy Apps Script** → Copy URL
2. **Update `.env`** → Paste URL
3. **Restart Server** → Ctrl+C, npm run dev
4. **Test** → Buka `test-apps-script-connection.html`

Jika masih error, kemungkinan:
- Credentials Tripay salah (check Apps Script Properties)
- Network blocked (check firewall/proxy)
- Browser cache (hard refresh: Ctrl+Shift+R)
