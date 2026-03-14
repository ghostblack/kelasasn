# Admin Login Troubleshooting Guide

## Konfigurasi Firebase

### Status Konfigurasi
Konfigurasi Firebase sudah BENAR dan terhubung ke:
- **Project ID**: kelasasn2026
- **Auth Domain**: kelasasn2026.firebaseapp.com
- **Database**: Firestore

File konfigurasi: `src/lib/firebase.ts`

## Cara Membuat Admin (LANGKAH DEMI LANGKAH)

### Metode 1: Menggunakan File create-admin.html (TERMUDAH)

1. **Buka file create-admin.html**
   - File ini sudah dibuat di root project
   - Buka langsung di browser (double-click atau drag ke browser)

2. **Isi Form**
   - Email: `admin@kelasasn.com` (atau email lain yang Anda inginkan)
   - Password: Minimal 6 karakter (contoh: `Admin123!`)
   - Nama: `Admin KelasASN`

3. **Klik "Buat Akun Admin"**
   - Tunggu beberapa detik
   - Jika berhasil, akan muncul notifikasi sukses dengan UID

4. **Selesai!**
   - Sekarang login di `/admin/login` dengan email dan password yang dibuat
   - **PENTING**: Hapus file `create-admin.html` setelah selesai untuk keamanan

### Metode 2: Menggunakan Firebase Console (Manual)

1. **Buka Firebase Console**
   ```
   https://console.firebase.google.com/project/kelasasn2026
   ```

2. **Buat User di Authentication**
   - Klik menu **Authentication** di sidebar
   - Tab **Users**
   - Klik **Add user**
   - Email: `admin@kelasasn.com`
   - Password: `Admin123!` (atau password kuat lainnya)
   - Klik **Add user**
   - **COPY UID USER** yang baru dibuat (contoh: `abc123xyz789`)

3. **Tambahkan ke Firestore Collection "admins"**
   - Klik menu **Firestore Database** di sidebar
   - Jika collection `admins` belum ada, klik **Start collection**
   - Collection ID: `admins`
   - Document ID: **[Paste UID yang di-copy]**
   - Tambahkan fields:
     ```
     uid: abc123xyz789               (type: string)
     email: admin@kelasasn.com       (type: string)
     role: admin                     (type: string)
     displayName: Admin KelasASN     (type: string)
     createdAt: [pilih timestamp]    (type: timestamp)
     ```
   - Klik **Save**

4. **Tambahkan ke Firestore Collection "users"**
   - Masih di **Firestore Database**
   - Buat/buka collection `users`
   - Document ID: **[UID yang sama]**
   - Tambahkan fields:
     ```
     uid: abc123xyz789               (type: string)
     email: admin@kelasasn.com       (type: string)
     displayName: Admin KelasASN     (type: string)
     createdAt: [pilih timestamp]    (type: timestamp)
     updatedAt: [pilih timestamp]    (type: timestamp)
     ```
   - Klik **Save**

5. **Selesai! Login sekarang**

## Troubleshooting Error

### Error: "Email atau password salah"
**Penyebab**: Kredensial yang dimasukkan tidak sesuai dengan yang ada di Firebase Authentication

**Solusi**:
1. Cek apakah email sudah benar (tidak ada spasi, huruf besar/kecil benar)
2. Cek apakah password benar
3. Buka Firebase Console > Authentication > Users untuk melihat email yang terdaftar
4. Jika lupa password, bisa reset melalui Firebase Console

### Error: "Akun tidak ditemukan"
**Penyebab**: Email belum didaftarkan di Firebase Authentication

**Solusi**:
1. Buat akun terlebih dahulu menggunakan salah satu metode di atas
2. Pastikan akun berhasil dibuat di Firebase Console > Authentication > Users

### Error: "Akun Anda tidak terdaftar sebagai admin"
**Penyebab**: User berhasil login tetapi tidak ada di collection `admins` atau role bukan "admin"

**Solusi**:
1. Buka Firebase Console > Firestore Database
2. Cek collection `admins`
3. Pastikan ada document dengan ID = UID user
4. Pastikan field `role` bernilai `"admin"` (bukan "user" atau lainnya)
5. Jika belum ada, tambahkan document sesuai langkah Metode 2 poin 3

### Error: "Role Anda bukan admin"
**Penyebab**: Document ada di collection `admins` tetapi field `role` bukan "admin"

**Solusi**:
1. Buka Firebase Console > Firestore Database > collection `admins`
2. Cari document dengan UID user yang login
3. Edit field `role` menjadi `"admin"` (pastikan lowercase dan string)

### Error: "Koneksi gagal" / "Network request failed"
**Penyebab**: Tidak ada koneksi internet atau Firebase down

**Solusi**:
1. Periksa koneksi internet
2. Coba refresh halaman
3. Cek status Firebase di https://status.firebase.google.com

### Error: "Terlalu banyak percobaan login"
**Penyebab**: Terlalu banyak percobaan login yang gagal dalam waktu singkat

**Solusi**:
1. Tunggu 10-15 menit
2. Atau reset password user di Firebase Console

## Cara Mengecek Login (Debug)

Buka Developer Tools (F12) di browser dan lihat tab **Console** saat login. Anda akan melihat log seperti:

```
Attempting login with email: admin@kelasasn.com
User authenticated successfully, UID: abc123xyz789
Checking admin status...
Admin document exists: true
Admin data: {uid: "abc123xyz789", email: "admin@kelasasn.com", role: "admin", ...}
```

Jika ada error, akan muncul error code dan message yang membantu troubleshooting.

## Checklist Verifikasi

Pastikan semua ini sudah benar:

- [ ] User sudah dibuat di Firebase Authentication
- [ ] User memiliki email dan password yang valid
- [ ] Document ada di Firestore collection `admins` dengan Document ID = UID user
- [ ] Field `role` di document admins bernilai `"admin"` (string, lowercase)
- [ ] Field `uid` di document admins sama dengan UID user
- [ ] Document juga ada di collection `users` (opsional tapi disarankan)
- [ ] Koneksi internet stabil
- [ ] Tidak ada error di console browser

## Struktur Data yang Benar

### Firebase Authentication
```
User:
  UID: abc123xyz789
  Email: admin@kelasasn.com
  Email Verified: false
  Created: [timestamp]
```

### Firestore Collection: admins
```
Document ID: abc123xyz789
{
  uid: "abc123xyz789",
  email: "admin@kelasasn.com",
  role: "admin",
  displayName: "Admin KelasASN",
  createdAt: Timestamp
}
```

### Firestore Collection: users
```
Document ID: abc123xyz789
{
  uid: "abc123xyz789",
  email: "admin@kelasasn.com",
  displayName: "Admin KelasASN",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Login Flow

1. User memasukkan email dan password di `/admin/login`
2. Sistem verifikasi dengan Firebase Authentication
3. Jika autentikasi berhasil, ambil UID user
4. Cek collection `admins` dengan UID tersebut
5. Jika document ada dan `role === "admin"`, login berhasil
6. Redirect ke `/admin/dashboard`

Jika salah satu langkah gagal, akan muncul error yang sesuai.

## Kontak

Jika masih mengalami masalah, pastikan:
1. Firebase project `kelasasn2026` masih aktif
2. Billing Firebase masih aktif (jika menggunakan plan berbayar)
3. Tidak ada perubahan konfigurasi di Firebase Console
