# Quick Admin Setup - 3 Langkah Mudah

## Status Konfigurasi Firebase
✓ Firebase sudah terkonfigurasi dengan benar
✓ Koneksi ke project: kelasasn2026
✓ Authentication dan Firestore sudah siap

## Cara Tercepat Membuat Admin

### Langkah 1: Test Koneksi (Opsional)
Buka file `test-firebase-connection.html` di browser untuk memastikan Firebase terhubung dengan baik.

### Langkah 2: Buat Akun Admin
Buka file `create-admin.html` di browser, lalu:
1. Isi email: `admin@kelasasn.com`
2. Isi password: `Admin123!` (atau password kuat lainnya)
3. Klik "Buat Akun Admin"
4. Tunggu notifikasi sukses

### Langkah 3: Login
1. Buka aplikasi di browser
2. Akses `/admin/login`
3. Login dengan email dan password yang dibuat
4. Selesai!

## Error yang Mungkin Terjadi

**"Missing or insufficient permissions"** ⚠ PALING SERING
→ **Firestore Rules belum dikonfigurasi!**
Solusi:
1. Buka https://console.firebase.google.com/project/kelasasn2026/firestore/rules
2. Paste rules dari file `FIRESTORE_RULES.md`
3. Klik "Publish"
4. Coba lagi

**"Email atau password salah"**
→ Pastikan email dan password yang dimasukkan benar

**"Akun tidak ditemukan"**
→ Buat akun admin terlebih dahulu menggunakan `create-admin.html`

**"Akun tidak terdaftar sebagai admin"**
→ Ada masalah di Firestore. Buka Firebase Console dan pastikan:
  - Collection `admins` ada
  - Document dengan UID user ada
  - Field `role` bernilai `"admin"`

## Keamanan
**PENTING:** Setelah admin berhasil dibuat, hapus file berikut:
- `create-admin.html`
- `test-firebase-connection.html`

File-file ini hanya untuk setup awal dan tidak boleh di-deploy ke production.

## File Dokumentasi Lengkap

1. `ADMIN_SETUP.md` - Panduan lengkap berbagai cara setup admin
2. `ADMIN_LOGIN_TROUBLESHOOTING.md` - Troubleshooting detail untuk semua error
3. `QUICK_ADMIN_SETUP.md` - Panduan singkat (file ini)

## Akses URL

- User Login: `/login`
- Admin Login: `/admin/login`
- Admin Dashboard: `/admin/dashboard`

User biasa tidak bisa akses admin panel, dan sebaliknya.
