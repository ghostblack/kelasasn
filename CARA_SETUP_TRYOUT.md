# Cara Setup Sistem Try-Out

## Prerequisites

1. Firebase project sudah dibuat
2. Firestore sudah diaktifkan
3. Authentication sudah disetup
4. Admin user sudah dibuat

## Langkah 1: Setup Firebase Rules

1. Buka Firebase Console: https://console.firebase.google.com/
2. Pilih project: `kelasasn2026`
3. Buka menu **Firestore Database**
4. Klik tab **Rules**
5. Copy-paste rules dari file `TRYOUT_FIX_SUMMARY.md` bagian "Konfigurasi Firebase Rules yang Disarankan"
6. Klik **Publish**

## Langkah 2: Input Soal Try-Out

### Opsi A: Gunakan Seed Data (Recommended untuk Testing)
1. Login sebagai admin
2. Klik tombol **Seed Data** di dashboard admin
3. Tunggu hingga proses selesai
4. Soal akan otomatis diinput ke database

### Opsi B: Input Manual
1. Login sebagai admin
2. Buka menu **Kelola Soal**
3. Klik **Tambah Soal**
4. Isi form:
   - Teks soal
   - Pilihan jawaban (A, B, C, D, E)
   - Jawaban benar
   - Kategori (TWK, TIU, atau TKP)
   - Bobot soal
5. Klik **Simpan**
6. Ulangi untuk soal lainnya

**Jumlah Soal Minimum:**
- TWK: minimal 35 soal
- TIU: minimal 30 soal
- TKP: minimal 35 soal
- **Total minimum: 100 soal**

## Langkah 3: Buat Try-Out Package

1. Login sebagai admin
2. Buka menu **Kelola Try Out**
3. Klik **Tambah Try Out**
4. Isi form:

   **Informasi Dasar:**
   - Nama Try Out: contoh "Try Out CPNS 2024 - Batch 1"
   - Deskripsi: jelaskan tentang try out ini

   **Kategori & Harga:**
   - Kategori: Pilih "Gratis" atau "Premium"
   - Tipe: Pilih "SKD", "SKB", atau "BOTH"
   - Harga: Isi harga dalam Rupiah (0 untuk gratis)

   **Konfigurasi Soal:**
   - TWK: Jumlah soal (default: 35) dan Durasi dalam menit (default: 30)
   - TIU: Jumlah soal (default: 30) dan Durasi dalam menit (default: 35)
   - TKP: Jumlah soal (default: 35) dan Durasi dalam menit (default: 25)

   **Fitur:**
   - Ketik fitur try-out (contoh: "Pembahasan lengkap")
   - Klik **Tambah** untuk menambah ke list
   - Ulangi untuk fitur lainnya

   **Pemilihan Soal:**
   - Klik **Pilih Otomatis** untuk auto-select soal sesuai konfigurasi
   - ATAU klik **Pilih Soal** untuk manual selection
   - Pastikan jumlah soal terpilih sesuai dengan konfigurasi (TWK: 35, TIU: 30, TKP: 35)

   **Status:**
   - Centang **Try Out Aktif** agar visible untuk user

5. Klik **Tambah Try Out**

## Langkah 4: Verifikasi Try-Out

1. Logout dari admin
2. Login sebagai user biasa
3. Buka menu **Try Out**
4. Periksa apakah try-out muncul di list
5. Klik try-out untuk melihat detail
6. Periksa informasi:
   - Nama try-out
   - Harga
   - Total soal
   - Total durasi
   - Fitur-fitur

## Langkah 5: Test User Flow

### Test Pembelian Try-Out

1. Di halaman detail try-out, klik **Beli Sekarang** (atau **Ambil Gratis** untuk try-out gratis)
2. Sistem akan otomatis mencatat pembelian
3. Status tombol berubah menjadi **Mulai Try Out**

### Test Eksekusi Try-Out

1. Klik **Mulai Try Out**
2. Sistem akan memuat soal-soal
3. Periksa:
   - Timer berjalan
   - Soal muncul sesuai kategori
   - Bisa menjawab soal
   - Bisa navigasi antar soal
   - Progress tracking berfungsi
4. Setelah selesai, klik **Selesai**
5. Lihat hasil try-out

### Test Ranking

1. Buka menu **Ranking**
2. Periksa apakah hasil try-out muncul dalam ranking
3. Filter berdasarkan try-out tertentu

## Troubleshooting

### Try-Out Tidak Muncul

**Penyebab:**
- Try-out belum di-set sebagai aktif (`isActive = false`)
- Firebase rules tidak mengizinkan read access
- Try-out tidak memiliki soal

**Solusi:**
1. Login sebagai admin
2. Edit try-out
3. Pastikan **Try Out Aktif** tercentang
4. Pastikan soal sudah dipilih (minimal TWK: 35, TIU: 30, TKP: 35)
5. Klik **Simpan Perubahan**

### Error "Gagal memuat data try out"

**Penyebab:**
- Firebase rules terlalu restrictive
- Collection `tryout_packages` tidak ada
- Network error

**Solusi:**
1. Periksa Firebase Rules
2. Pastikan rules mengizinkan read access untuk authenticated users
3. Periksa browser console untuk error detail

### Soal Tidak Muncul Saat Eksekusi Try-Out

**Penyebab:**
- Try-out belum dibeli user
- `questionIds` di try-out kosong
- Soal sudah dihapus dari database

**Solusi:**
1. Pastikan user sudah membeli try-out
2. Login sebagai admin
3. Edit try-out
4. Klik **Pilih Otomatis** atau **Pilih Soal**
5. Pastikan soal terpilih (ditampilkan di bagian "Soal Terpilih")
6. Klik **Simpan Perubahan**

### Error Saat Menyimpan Jawaban

**Penyebab:**
- Firebase rules tidak mengizinkan write access ke `tryout_sessions`
- Session sudah expired

**Solusi:**
1. Periksa Firebase Rules
2. Pastikan rules mengizinkan user untuk update session sendiri

## Best Practices

### Untuk Admin:

1. **Selalu gunakan "Pilih Otomatis"** untuk memastikan jumlah soal sesuai konfigurasi
2. **Set harga yang reasonable** untuk try-out premium
3. **Buat deskripsi yang jelas** agar user tahu apa yang didapat
4. **Gunakan fitur** untuk highlight value proposition try-out
5. **Test try-out** sebagai user sebelum dipublish ke production

### Untuk Development:

1. **Gunakan Seed Data** untuk testing
2. **Test dengan berbagai skenario**:
   - Try-out gratis
   - Try-out premium
   - User yang sudah membeli vs belum
   - User yang sudah menyelesaikan vs belum
3. **Monitor Firebase Console** untuk melihat data yang tersimpan
4. **Check browser console** untuk error message

## Data Structure Reference

### TryoutPackage
```typescript
{
  id: string;
  name: string;
  description: string;
  price: number;                    // Harga dalam Rupiah
  category: 'free' | 'premium';     // Kategori try-out
  type: 'SKD' | 'SKB' | 'BOTH';     // Tipe try-out
  features: string[];               // Array fitur try-out
  twkDuration: number;              // Durasi TWK dalam menit
  tiuDuration: number;              // Durasi TIU dalam menit
  tkpDuration: number;              // Durasi TKP dalam menit
  twkQuestions: number;             // Jumlah soal TWK
  tiuQuestions: number;             // Jumlah soal TIU
  tkpQuestions: number;             // Jumlah soal TKP
  totalQuestions: number;           // Total soal (otomatis calculated)
  isActive: boolean;                // Status aktif/nonaktif
  questionIds: string[];            // Array ID soal yang dipilih
  createdAt: Date;
}
```

### UserTryout
```typescript
{
  id: string;
  userId: string;                   // ID user yang membeli
  tryoutId: string;                 // ID try-out package
  tryoutName: string;               // Nama try-out
  purchaseDate: Date;               // Tanggal pembelian
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: Date;               // Tanggal selesai (jika sudah)
  paymentStatus: 'pending' | 'success' | 'failed';
  transactionId?: string;           // ID transaksi
}
```

## Contact & Support

Jika mengalami masalah yang tidak tercakup dalam dokumentasi ini:
1. Check browser console untuk error message
2. Check Firebase Console → Firestore untuk melihat data
3. Check Firebase Console → Authentication untuk melihat user
4. Check Firebase Console → Rules untuk melihat security rules
