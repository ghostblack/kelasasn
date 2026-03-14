# Admin Setup Guide - KelasASN

## Konfigurasi Firebase

Aplikasi ini menggunakan Firebase dengan konfigurasi berikut:
- Project: **kelasasn2026**
- Auth Domain: kelasasn2026.firebaseapp.com
- Database: Firestore

## Membuat Akun Admin

### CARA TERMUDAH: Menggunakan Halaman Buat Admin

1. Buka file `create-admin.html` di browser
2. Isi form dengan data admin:
   - Email: `admin@kelasasn.com` (atau email lain)
   - Password: minimal 6 karakter (gunakan password yang kuat)
   - Nama: `Admin KelasASN` (atau nama lain)
3. Klik tombol **"Buat Akun Admin"**
4. Tunggu proses selesai (akan muncul notifikasi sukses)
5. **PENTING**: Hapus file `create-admin.html` setelah selesai untuk keamanan
6. Sekarang Anda bisa login di `/admin/login`

### Cara Alternatif 1: Melalui Firebase Console

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Pilih project: **kelasasn2026**
3. Masuk ke **Authentication** > **Users**
4. Klik **Add User** dan buat user baru:
   - Email: `admin@kelasasn.com`
   - Password: (buat password yang kuat, min 6 karakter)
5. Setelah user dibuat, **salin User UID** (contoh: `abc123xyz789`)

6. Masuk ke **Firestore Database**
7. Klik **Start collection** atau buka collection `admins` (jika sudah ada)
8. Tambahkan document baru:
   - Document ID: **[paste User UID yang disalin]**
   - Fields:
     ```
     uid: [User UID yang sama]        (string)
     email: "admin@kelasasn.com"      (string)
     role: "admin"                     (string)
     displayName: "Admin KelasASN"    (string)
     createdAt: [pilih timestamp]     (timestamp)
     ```

9. Juga tambahkan ke collection `users`:
   - Document ID: **[User UID yang sama]**
   - Fields:
     ```
     uid: [User UID]                  (string)
     email: "admin@kelasasn.com"      (string)
     displayName: "Admin KelasASN"    (string)
     createdAt: [pilih timestamp]     (timestamp)
     updatedAt: [pilih timestamp]     (timestamp)
     ```

10. Selesai! Login di `/admin/login`

### Cara Alternatif 2: Menggunakan Script Node.js

Jika Anda memiliki akses ke Firebase Admin SDK, buat script berikut:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdmin() {
  try {
    const userRecord = await auth.createUser({
      email: 'admin@kelasasn.com',
      password: 'YourSecurePassword123!',
      displayName: 'Admin KelasASN'
    });

    await db.collection('admins').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: 'admin@kelasasn.com',
      role: 'admin',
      displayName: 'Admin KelasASN',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: 'admin@kelasasn.com',
      displayName: 'Admin KelasASN',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Admin created successfully!');
    console.log('UID:', userRecord.uid);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdmin();
```

## Akses Admin Panel

Setelah akun admin dibuat, Anda bisa:

1. Buka `/admin/login`
2. Login dengan email dan password admin yang telah dibuat
3. Anda akan diarahkan ke `/admin/dashboard`

## Fitur Admin Panel

Di admin panel, Anda bisa:

- **Dashboard**: Melihat statistik total soal, try out, user, dan peserta
- **Kelola Soal**: Tambah, edit, dan hapus soal TWK, TIU, TKP
- **Kelola Try Out**: Buat try out baru dengan memilih soal-soal yang sudah dibuat

## Catatan Keamanan

- Jangan share kredensial admin dengan sembarang orang
- Gunakan password yang kuat (minimal 8 karakter, kombinasi huruf besar, kecil, angka, dan simbol)
- Simpan kredensial admin di tempat yang aman
- Jangan commit kredensial admin ke repository

## Credentials Admin Default (untuk testing)

**PENTING: Segera ubah password ini setelah pertama kali login!**

- Email: `admin@kelasasn.com`
- Password: Akan dibuat sesuai instruksi di atas

## Login URL

- User Login: `/login`
- Admin Login: `/admin/login`

User biasa tidak bisa mengakses admin panel, begitu juga sebaliknya.
