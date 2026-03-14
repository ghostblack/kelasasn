# Dashboard User Kelas ASN

Dashboard lengkap untuk platform try out CPNS Kelas ASN dengan Firebase Firestore sebagai database.

## Fitur Dashboard

### 1. **Home Dashboard**
- Statistik user: Total try out, Nilai tertinggi, Nilai rata-rata, Ranking terbaik
- Daftar try out yang sudah dibeli
- Button "Seed Data" untuk populate database dengan data dummy (klik tombol di pojok kanan bawah)

### 2. **List Try Out**
- Menampilkan semua paket try out tersedia
- Filter berdasarkan kategori: Semua, Gratis, Premium, SKD, SKB
- Search try out by nama
- Badge "Sudah Dibeli" pada try out yang sudah dibeli
- Modal detail try out dengan fitur lengkap
- Simulasi pembelian try out (payment gateway siap diintegrasikan)

### 3. **Ranking**
- Leaderboard peserta try out
- Filter berdasarkan try out tertentu atau semua try out
- Badge special untuk Top 3 (Gold, Silver, Bronze)
- Highlight row user yang sedang login
- Ranking real-time dari Firestore

### 4. **Daftar Jabatan**
- List jabatan/formasi CPNS 2024
- Search dan filter berdasarkan kategori (Teknis, Kesehatan, Pendidikan, Umum)
- Accordion untuk detail lengkap setiap jabatan:
  - Kode jabatan
  - Formasi
  - Passing grade
  - Kualifikasi
  - Try out terkait

### 5. **Profile User**
- Edit profil: Display Name, Phone Number
- Upload foto profil (Firebase Storage)
- Info akun: Status email, Tanggal bergabung, User ID
- Update profile sync dengan Firebase Auth

## Teknologi

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage (untuk foto profil)
- **Routing**: React Router v6

## Struktur Database Firestore

### Collections:

1. **users**
   - uid, email, displayName, photoURL, phoneNumber, createdAt, updatedAt

2. **tryout_packages**
   - name, description, price, category, type, features[], duration, totalQuestions, isActive, createdAt

3. **user_tryouts**
   - userId, tryoutId, tryoutName, purchaseDate, status, completedAt, paymentStatus, transactionId

4. **tryout_results**
   - userId, tryoutId, tryoutName, score, rank, totalParticipants, answers, completedAt

5. **jabatan**
   - kodeJabatan, namaJabatan, instansi, formasi, passingGrade, kategori, kualifikasi[], relatedTryouts[], createdAt

## Cara Menggunakan

### 1. Seeding Data Dummy
- Login ke dashboard
- Klik button "Seed Data" di pojok kanan bawah halaman Home
- Data try out packages (6 paket) dan jabatan (10 jabatan) akan otomatis ditambahkan ke Firestore
- Button ini hanya akan seed data jika belum ada data di database

### 2. Membeli Try Out
- Pergi ke menu "List Try Out"
- Pilih try out yang diinginkan
- Klik "Beli Sekarang"
- Konfirmasi pembelian di modal
- Try out akan otomatis ditambahkan ke "Try Out Saya"

### 3. Melihat Ranking
- Pergi ke menu "Ranking"
- Pilih try out tertentu atau "Semua Try Out" dari dropdown
- Lihat ranking peserta dengan score tertinggi

### 4. Mencari Jabatan
- Pergi ke menu "Daftar Jabatan"
- Gunakan search box untuk mencari jabatan
- Filter berdasarkan kategori
- Klik accordion untuk melihat detail lengkap

### 5. Update Profile
- Pergi ke menu "Profile"
- Edit nama lengkap dan nomor telepon
- Upload foto profil (opsional)
- Klik "Simpan Perubahan"

## Routes

- `/` - Landing page
- `/login` - Halaman login
- `/register` - Halaman registrasi
- `/verify-email` - Halaman verifikasi email
- `/dashboard` - Home dashboard (protected)
- `/dashboard/tryouts` - List try out (protected)
- `/dashboard/ranking` - Ranking leaderboard (protected)
- `/dashboard/jabatan` - Daftar jabatan (protected)
- `/dashboard/profile` - Profile user (protected)

## Protected Routes

Semua route `/dashboard/*` dilindungi dengan:
1. Authentication check - user harus login
2. Email verification check - email harus sudah diverifikasi
3. Auto redirect ke `/login` jika belum login
4. Auto redirect ke `/verify-email` jika email belum diverifikasi

## Tema Desain

Dashboard menggunakan tema konsisten dengan landing page:
- **Primary Color**: `#2c27e1` (Biru)
- **Secondary Color**: `#050505` (Hitam)
- **Accent Colors**:
  - Hijau: `#19b269`
  - Pink: `#ef579b`
- **Font**: PP Neue Montreal (custom font)
- **Border Radius**: Besar (rounded-xl, rounded-2xl)
- **Shadows**: Halus dan modern
- **Animations**: Smooth fade, slide, scale transitions

## Payment Gateway (Future)

Struktur sudah disiapkan untuk integrasi payment gateway:
- Field `paymentStatus`: 'pending', 'success', 'failed'
- Field `transactionId` untuk tracking
- Saat ini simulasi payment langsung set status 'success'
- Siap untuk integrasi Midtrans/Xendit/payment gateway lainnya

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Notes

- Semua data user, try out, dan ranking disimpan di Firebase Firestore
- Real-time updates menggunakan Firestore listeners
- Error handling dan loading states sudah diimplementasikan
- Toast notifications untuk user feedback
- Responsive design untuk mobile dan desktop
- SEO-friendly dengan proper meta tags
