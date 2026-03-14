# Improved Question Management Flow

Flow pembuatan soal telah diperbaiki untuk meningkatkan User Experience admin dengan memisahkan proses input soal menjadi lebih modular dan tidak membebani performa halaman.

## Flow Baru

### 1. **Halaman Pembuatan Try Out** (`CreateTryoutPage`)
- Admin mengisi informasi dasar try out (nama, deskripsi, jumlah soal, dll)
- Setelah klik "Simpan & Lanjut Input Soal", try out akan tersimpan ke database
- Otomatis redirect ke halaman kategori soal

### 2. **Halaman Kategori Soal** (`TryoutQuestionCategories`)
**Route:** `/admin/tryouts/:tryoutId/questions`

Halaman ini menampilkan 3 kategori soal dalam bentuk card:
- **TWK** - Tes Wawasan Kebangsaan
- **TIU** - Tes Intelegensia Umum
- **TKP** - Tes Karakteristik Pribadi

Setiap card menampilkan:
- Progress bar (jumlah soal yang sudah dibuat / target)
- Badge status (hijau jika complete, abu-abu jika belum)
- Deskripsi kategori

### 3. **Halaman Input Soal Individual** (`TryoutQuestionInput`)
**Route:** `/admin/tryouts/:tryoutId/questions/:category/input`

Admin dapat input 1 soal untuk kategori yang dipilih dengan fitur:
- Form lengkap untuk 1 soal (pertanyaan, gambar, pilihan A-E, jawaban benar, pembahasan)
- Untuk soal TKP, ada input skor tambahan untuk setiap pilihan (0-5 poin)
- 2 pilihan tombol save:
  - **Simpan & Buat Baru**: Menyimpan soal dan form direset untuk input soal baru
  - **Simpan & Lihat Daftar**: Menyimpan soal dan redirect ke list soal

### 4. **Halaman List Soal** (`TryoutQuestionList`)
**Route:** `/admin/tryouts/:tryoutId/questions/:category/list`

Menampilkan daftar semua soal untuk kategori yang dipilih:
- View list dengan accordion (expand/collapse untuk melihat detail soal)
- Fitur search soal
- Badge menampilkan jumlah total soal
- Button untuk tambah soal baru
- Button edit dan delete untuk setiap soal
- Untuk soal TKP, menampilkan skor setiap pilihan jawaban

## Keuntungan Flow Baru

### 1. **Performa Lebih Baik**
- Tidak semua soal dimuat dalam 1 halaman
- Setiap kategori terpisah sehingga mengurangi beban render
- Input 1 per 1 soal mencegah lag saat form terlalu banyak

### 2. **UX Lebih Baik untuk Admin**
- Flow yang jelas dan terstruktur
- Progress visual yang mudah dipahami
- Tidak overwhelming dengan form yang terlalu panjang
- Admin bisa fokus pada 1 kategori soal dalam 1 waktu

### 3. **Maintainability Lebih Baik**
- Kode terpisah dalam 3 file berbeda (separation of concerns)
- Lebih mudah untuk debugging
- Lebih mudah untuk menambah fitur baru

### 4. **Fleksibilitas**
- Admin bisa input soal secara bertahap (tidak harus sekaligus)
- Bisa switch antar kategori dengan mudah
- Bisa review daftar soal kapan saja

## Files yang Dibuat

1. **`TryoutQuestionCategories.tsx`** - Halaman pemilihan kategori soal
2. **`TryoutQuestionInput.tsx`** - Halaman input soal individual
3. **`TryoutQuestionList.tsx`** - Halaman daftar soal per kategori

## Routes yang Ditambahkan

```tsx
<Route path="tryouts/:tryoutId/questions" element={<TryoutQuestionCategories />} />
<Route path="tryouts/:tryoutId/questions/:category/input" element={<TryoutQuestionInput />} />
<Route path="tryouts/:tryoutId/questions/:category/list" element={<TryoutQuestionList />} />
```

## Perubahan pada File Existing

### `CreateTryoutPage.tsx`
- Menghapus step "questions" yang lama
- Hanya focus pada input informasi try out
- Setelah save, langsung redirect ke halaman kategori soal
- Menghapus semua kode yang berkaitan dengan form soal massal

### `index.tsx`
- Menambahkan import untuk 3 komponen baru
- Menambahkan 3 routes baru

## Cara Penggunaan

1. Admin membuat try out baru di `/admin/tryouts/create`
2. Isi informasi try out dan klik "Simpan & Lanjut Input Soal"
3. Pilih kategori soal (TWK/TIU/TKP)
4. Input soal satu per satu
5. Klik "Simpan & Buat Baru" untuk lanjut input soal lagi, atau "Simpan & Lihat Daftar" untuk melihat daftar soal
6. Dari daftar soal, admin bisa edit/delete soal atau tambah soal baru
7. Kembali ke halaman kategori untuk melihat progress atau pindah ke kategori lain
8. Setelah semua soal terisi sesuai target, klik "Selesai & Kembali"
