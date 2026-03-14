# KelasASN - Platform Try Out CPNS

Platform lengkap untuk latihan Try Out CPNS dengan sistem manajemen soal dan pengguna.

## Fitur Utama

### Untuk User
- **Registrasi & Login**: Sistem autentikasi menggunakan Firebase
- **Dashboard**: Melihat statistik dan progress belajar
- **List Try Out**: Katalog try out yang tersedia (gratis & premium)
- **Pembelian Try Out**: Sistem pembelian (saat ini gratis, siap untuk integrasi payment gateway)
- **Pengerjaan Try Out**:
  - Timer per kategori (TWK, TIU, TKP)
  - Navigasi soal yang mudah
  - Auto-save jawaban
  - Submit otomatis saat waktu habis
- **Hasil & Pembahasan**:
  - Skor detail per kategori
  - Ranking peserta
  - Pembahasan lengkap tiap soal
- **Ranking Global**: Melihat peringkat dengan pengguna lain
- **Jabatan**: Informasi formasi dan passing grade CPNS

### Untuk Admin
- **Login Terpisah**: Admin memiliki panel login khusus
- **Dashboard Admin**: Statistik total soal, try out, user, dan peserta
- **Kelola Soal**:
  - CRUD soal TWK, TIU, TKP
  - Upload gambar soal
  - Tambah pembahasan
  - Filter dan search soal
- **Kelola Try Out**:
  - Buat paket try out baru
  - Konfigurasi durasi per kategori
  - Pilih soal untuk try out
  - Atur harga (free/premium)
  - Auto-select soal berdasarkan jumlah

## Struktur Database (Firebase Firestore)

### Collections:

1. **users** - Data pengguna
2. **admins** - Data admin
3. **tryout_packages** - Paket try out
4. **questions** - Bank soal
5. **user_tryouts** - Try out yang dibeli user
6. **tryout_sessions** - Session pengerjaan try out
7. **tryout_results** - Hasil try out
8. **jabatan** - Data formasi jabatan CPNS

## Format Try Out CPNS

Sesuai dengan format tes SKD CPNS:

### TWK (Tes Wawasan Kebangsaan)
- Jumlah soal: 35 soal
- Durasi: 30 menit
- Skor maksimal: 500 (100 per soal benar)

### TIU (Tes Intelegensi Umum)
- Jumlah soal: 30 soal
- Durasi: 35 menit
- Skor maksimal: 750 (150 per soal benar)

### TKP (Tes Karakteristik Pribadi)
- Jumlah soal: 35 soal
- Durasi: 25 menit
- Skor maksimal: 830 (166 per soal benar)

**Total**: 100 soal dalam 90 menit

## Teknologi yang Digunakan

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router DOM v6
- **UI Components**: Shadcn UI + Radix UI
- **Styling**: Tailwind CSS
- **Backend/Database**: Firebase (Authentication + Firestore)
- **Build Tool**: Vite
- **Icons**: Lucide React

## Setup & Installation

### Prerequisites
- Node.js (v16 atau lebih baru)
- NPM atau Yarn
- Akun Firebase

### Langkah-langkah

1. **Install dependencies**
```bash
npm install
```

2. **Setup Firebase**
Firebase sudah dikonfigurasi di `src/lib/firebase.ts` dengan project `kelasasn2026`

3. **Setup Admin**
Lihat file `ADMIN_SETUP.md` untuk cara membuat akun admin pertama kali

4. **Run Development Server**
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`

5. **Build untuk Production**
```bash
npm run build
```

## URL Routes

### User Routes
- `/` - Landing page
- `/login` - Login user
- `/register` - Register user
- `/dashboard` - Dashboard user
- `/dashboard/tryouts` - List try out
- `/dashboard/tryout/:id` - Detail try out
- `/dashboard/tryout/:id/exam` - Halaman pengerjaan
- `/dashboard/tryout/:id/result` - Hasil try out
- `/dashboard/ranking` - Ranking global
- `/dashboard/jabatan` - Info jabatan CPNS
- `/dashboard/profile` - Profile user

### Admin Routes
- `/admin/login` - Login admin
- `/admin/dashboard` - Dashboard admin
- `/admin/questions` - Kelola soal
- `/admin/tryouts` - Kelola try out

## Flow Aplikasi

### User Flow
1. User register/login
2. Browse list try out yang tersedia
3. Klik detail try out untuk melihat informasi lengkap
4. Beli/ambil try out (gratis untuk sementara)
5. Mulai mengerjakan try out
6. Sistem akan tracking waktu per kategori (TWK, TIU, TKP)
7. User bisa navigasi antar soal dan kategori
8. Submit jawaban (manual atau otomatis saat waktu habis)
9. Lihat hasil lengkap dengan pembahasan
10. Cek ranking dengan peserta lain

### Admin Flow
1. Admin login di `/admin/login`
2. Buat bank soal terlebih dahulu di menu "Kelola Soal"
3. Setelah soal cukup, buat paket try out di menu "Kelola Try Out"
4. Pilih soal yang akan masuk ke try out
5. Konfigurasi durasi, harga, dan fitur
6. Aktifkan try out
7. User sudah bisa membeli dan mengerjakan

## Persiapan Payment Gateway

Sistem sudah siap untuk integrasi payment gateway:

1. Field `price` di `tryout_packages` untuk harga
2. Field `paymentStatus` di `user_tryouts` untuk status pembayaran
3. Field `transactionId` untuk tracking transaksi

Untuk mengintegrasikan payment gateway (misal: Midtrans, Xendit):
1. Tambahkan service payment di `src/services/paymentService.ts`
2. Update fungsi `purchaseTryout` untuk handle payment
3. Tambahkan webhook handler untuk payment notification
4. Update UI untuk menampilkan status pembayaran

## Security

- Autentikasi menggunakan Firebase Authentication
- Protected routes untuk user dan admin
- Admin role-based access control
- Validasi di frontend dan backend
- Secure Firebase rules (perlu dikonfigurasi di Firebase Console)

## Firebase Security Rules (Rekomendasi)

Pastikan Anda set Firebase Security Rules di Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Admins collection (read-only for checking admin status)
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can write via console
    }

    // Tryout packages (public read, admin write)
    match /tryout_packages/{packageId} {
      allow read: if true;
      allow write: if request.auth != null; // Should check admin role
    }

    // Questions (admin only)
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Should check admin role
    }

    // User tryouts
    match /user_tryouts/{tryoutId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update: if request.auth.uid == resource.data.userId;
    }

    // Tryout sessions
    match /tryout_sessions/{sessionId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }

    // Tryout results
    match /tryout_results/{resultId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Jabatan (public read)
    match /jabatan/{jabatanId} {
      allow read: if true;
      allow write: if request.auth != null; // Should check admin role
    }
  }
}
```

## Catatan Penting

1. **Admin Setup**: Baca `ADMIN_SETUP.md` untuk membuat admin pertama kali
2. **Firebase Config**: Kredensial Firebase sudah ada di kode (untuk development)
3. **Production**: Ganti Firebase config dengan environment variables
4. **Payment Gateway**: Siap untuk integrasi, tinggal tambahkan provider
5. **Soal**: Admin harus buat soal dulu sebelum bisa buat try out

## Troubleshooting

### Try out tidak muncul
- Pastikan try out sudah diaktifkan di admin panel
- Cek field `isActive` di Firestore

### Tidak bisa login sebagai admin
- Pastikan sudah membuat akun admin di Firebase
- Pastikan ada document di collection `admins` dengan role = 'admin'
- Cek `ADMIN_SETUP.md` untuk panduan lengkap

### Soal tidak muncul saat mengerjakan try out
- Pastikan try out sudah memiliki soal (field `questionIds` tidak kosong)
- Pastikan soal yang dipilih ada di database

### Timer tidak berjalan
- Cek console browser untuk error
- Pastikan field durasi sudah terisi di try out

## Development Tips

- Gunakan React DevTools untuk debugging
- Cek Firebase Console untuk melihat data real-time
- Gunakan browser console untuk testing
- Jalankan `npm run build` sebelum deploy untuk cek error

## Support & Contact

Untuk pertanyaan atau bantuan, silakan kontak developer atau buka issue di repository.

## License

All rights reserved - KelasASN 2024
