# Perubahan Sistem Pengacakan Soal Tryout

## Ringkasan Perubahan

Sistem pengacakan soal tryout telah diperbaiki dengan karakteristik berikut:

### 1. **Urutan Pilihan Jawaban (A, B, C, D, E)**
- ✅ **TIDAK DIACAK** - tetap sesuai dengan urutan input dari admin
- Pilihan jawaban akan selalu tampil dalam urutan yang sama seperti yang diinput

### 2. **Urutan Nomor Soal per Kategori**
- ✅ **DIACAK** untuk setiap pengerjaan baru
- Pengacakan dilakukan terpisah untuk masing-masing kategori:
  - TWK: Soal TWK diacak sendiri
  - TIU: Soal TIU diacak sendiri
  - TKP: Soal TKP diacak sendiri
- Setiap kali user mengerjakan tryout yang sama (attempt berbeda), urutan soal di setiap kategori akan berbeda
- Soal **TIDAK TERCAMPUR** antar kategori - TWK tetap di bagian TWK, TIU di bagian TIU, dst

### 3. **Urutan Tampilan**
Urutan soal yang muncul:
1. **Pengerjaan Pertama**: TWK (acak) → TIU (acak) → TKP (acak)
2. **Pengerjaan Kedua**: TWK (acak baru) → TIU (acak baru) → TKP (acak baru)
3. Dan seterusnya...

## File yang Dimodifikasi

### 1. `/src/types/index.ts`
- Menambahkan field `shuffledQuestionIds` pada interface `TryoutSession`
- Menambahkan field `shuffledQuestionIds` pada interface `TryoutResult`

### 2. `/src/services/tryoutSessionService.ts`
- Menambahkan fungsi `shuffleArray()` untuk mengacak array
- Menambahkan fungsi `shuffleQuestionsByCategory()` untuk mengacak soal per kategori
- Modifikasi `createTryoutSession()` untuk menerima `questionIds` dan melakukan pengacakan
- Modifikasi `completeTryoutSession()` untuk menyimpan `shuffledQuestionIds` ke result

### 3. `/src/services/questionService.ts`
- Modifikasi `getQuestionsByIds()` untuk mempertahankan urutan questionIds yang diberikan

### 4. `/src/screens/Dashboard/TryoutExamPage.tsx`
- Mengambil session terlebih dahulu untuk mendapatkan `shuffledQuestionIds`
- Menggunakan `shuffledQuestionIds` dari session untuk load soal
- Passing `questionIds` ke `createTryoutSession()`

### 5. `/src/screens/Dashboard/TryoutReviewPage.tsx`
- Menggunakan `shuffledQuestionIds` dari result untuk menampilkan review dengan urutan yang sama seperti saat pengerjaan

## Cara Kerja

1. **Saat User Memulai Tryout Baru:**
   - System membuat session baru via `createTryoutSession()`
   - Question IDs dari tryout dikelompokkan berdasarkan kategori (TWK, TIU, TKP)
   - Setiap kategori diacak secara terpisah
   - Urutan hasil pengacakan disimpan di field `shuffledQuestionIds` pada session

2. **Saat Mengerjakan Tryout:**
   - Soal ditampilkan sesuai urutan `shuffledQuestionIds` dari session
   - Pilihan jawaban (A-E) tetap dalam urutan original dari database

3. **Saat Review:**
   - System menggunakan `shuffledQuestionIds` dari result
   - Soal ditampilkan dalam urutan yang sama seperti saat pengerjaan

## Keuntungan

- ✅ Setiap pengerjaan memiliki urutan soal yang berbeda per kategori
- ✅ Mencegah hafalan urutan soal
- ✅ Pilihan jawaban tetap konsisten (tidak membingungkan)
- ✅ Review menampilkan urutan yang sama dengan saat pengerjaan
- ✅ Soal tetap terorganisir per kategori (TWK, TIU, TKP tidak tercampur)
