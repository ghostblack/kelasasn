# Fix: Soal Tidak Terdeteksi di Try Out

## Masalah
Try out yang sudah dibuat tidak menampilkan soal dan statusnya menjadi "Belum Tersedia", padahal soal sudah ada di database Firebase. Hal ini menyebabkan try out tidak bisa dibeli atau dikerjakan.

## Penyebab
Try out package di database tidak memiliki field `questionIds` yang terisi. Field `questionIds` adalah array yang menyimpan ID soal-soal yang sudah di-assign ke try out tersebut. Tanpa field ini, sistem tidak tahu soal mana yang harus ditampilkan untuk try out.

Pada file `TryoutDetailPage.tsx` baris 230:
```typescript
const hasQuestions = tryout.questionIds && tryout.questionIds.length > 0;
```

Jika `questionIds` kosong atau tidak ada, try out dianggap belum siap (baris 345-360).

## Solusi yang Dibuat

Saya telah membuat halaman admin baru **"Assign Questions to Tryout"** yang memungkinkan admin untuk:

1. Melihat soal-soal yang sudah ada di database
2. Memilih soal untuk di-assign ke try out tertentu
3. Menggunakan fitur "Auto Assign" untuk memilih soal secara otomatis sesuai jumlah yang dibutuhkan
4. Menyimpan assignment soal ke try out

### File yang Dibuat/Dimodifikasi:

1. **Baru**: `src/screens/Admin/AssignQuestionsToTryout.tsx` - Halaman untuk assign soal ke try out
2. **Modified**: `src/screens/Admin/TryoutsManagement.tsx` - Menambahkan tombol "Assign" untuk setiap try out
3. **Modified**: `src/screens/Admin/index.ts` - Export component baru
4. **Modified**: `src/index.tsx` - Menambahkan route `/admin/tryouts/:tryoutId/assign-questions`

## Cara Menggunakan

### Untuk Try Out yang Sudah Ada (Belum Punya Soal):

1. Login sebagai admin
2. Buka menu **Admin > Kelola Try Out** (`/admin/tryouts`)
3. Pada card try out yang ingin ditambahkan soal, klik tombol **"Assign"**
4. Anda akan melihat halaman dengan 3 kategori soal: TWK, TIU, dan TKP
5. Untuk setiap kategori:
   - Lihat berapa soal yang dibutuhkan vs tersedia
   - Klik tombol **"Auto Assign"** untuk memilih soal secara otomatis
   - Atau klik pada soal secara manual untuk memilih
6. Setelah memilih soal, klik tombol **"Assign ke Try Out"** di bagian bawah
7. Soal akan ditambahkan ke try out dan try out akan siap digunakan

### Untuk Try Out Baru:

Saat membuat try out baru melalui menu "Tambah Try Out", setelah menyimpan informasi try out, Anda akan diarahkan ke halaman input soal. Ada 2 cara:

**Cara 1: Input Soal Baru**
- Klik tombol **"Soal"** pada card try out
- Pilih kategori (TWK/TIU/TKP)
- Klik "Input Soal" untuk membuat soal baru
- Soal akan otomatis di-assign ke try out

**Cara 2: Assign Soal yang Sudah Ada**
- Klik tombol **"Assign"** pada card try out
- Gunakan halaman "Assign Questions" seperti dijelaskan di atas

## Verifikasi

Setelah meng-assign soal, pastikan:

1. Badge di halaman try out management menampilkan jumlah soal yang sudah di-assign
2. Try out bisa dibuka dari dashboard user
3. Try out tidak lagi menampilkan status "Belum Tersedia"
4. Try out bisa dibeli dan dikerjakan

## Catatan Penting

- Soal yang sudah di-assign ke try out tidak akan muncul lagi di daftar "available questions" ketika meng-assign soal
- Satu soal bisa di-assign ke multiple try out (tidak ada batasan)
- Field `questionIds` di database try out akan otomatis ter-update ketika meng-assign soal
- Jumlah soal yang di-assign harus sesuai dengan konfigurasi try out (TWK, TIU, TKP)

## Troubleshooting

**Q: Try out masih menampilkan "Belum Tersedia" setelah assign soal?**
A: Periksa di Firebase console apakah field `questionIds` sudah terisi. Jika belum, coba assign ulang.

**Q: Tidak ada soal yang tersedia untuk di-assign?**
A: Buat soal baru terlebih dahulu melalui menu "Input Soal" atau halaman Questions Management.

**Q: Soal yang di-assign tidak sesuai jumlah yang dibutuhkan?**
A: Gunakan fitur "Auto Assign" untuk memilih soal sesuai jumlah yang dikonfigurasi di try out. Atau pilih manual hingga mencapai jumlah yang diinginkan.
