# Update Sistem Penilaian TKP

## Ringkasan Perubahan

Sistem penilaian TKP telah diubah dari sistem penilaian benar/salah (seperti TWK dan TIU) menjadi sistem pembobotan 5-0 untuk setiap pilihan jawaban, yang lebih sesuai dengan standar penilaian TKP CPNS.

## Perubahan yang Dilakukan

### 1. Tipe Data Question
**File:** `src/types/index.ts`

Menambahkan field baru `tkpScoring` yang opsional untuk menyimpan bobot setiap pilihan jawaban:

```typescript
export interface Question {
  // ... field lainnya
  tkpScoring?: {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
  };
}
```

### 2. Perhitungan Skor di Exam Page
**File:** `src/screens/Dashboard/TryoutExamPage.tsx`

Fungsi `calculateScores()` diubah untuk:
- Menghitung skor TKP berdasarkan pembobotan (5-0) bukan benar/salah
- Menggunakan `tkpScoring` dari setiap soal TKP
- Total maksimal TKP = jumlah soal TKP × 5

**Sebelum:**
```typescript
tkpQuestions.forEach((q) => {
  if (session.answers[q.id] === q.correctAnswer) tkpCorrect++;
});
const tkpScore = (tkpCorrect / tkpQuestions.length) * 166;
```

**Sesudah:**
```typescript
tkpQuestions.forEach((q) => {
  const userAnswer = session.answers[q.id];
  if (userAnswer && q.tkpScoring) {
    tkpScore += q.tkpScoring[userAnswer];
  }
  if (session.answers[q.id] === q.correctAnswer) tkpCorrect++;
});
const tkpMaxScore = tkpQuestions.length * 5;
```

### 3. Tampilan Hasil di Result Page
**File:** `src/screens/Dashboard/TryoutResultPage.tsx`

Mengubah tampilan hasil TKP:
- Menampilkan "Nilai benar: X/Y" bukan "X/Y benar"
- Total maksimal dihitung dari jumlah soal × 5
- Persentase dihitung dari skor yang didapat dibanding total maksimal

**Tampilan Sebelum:**
```
166 / 175
35/45 benar
```

**Tampilan Sesudah:**
```
210 / 225  (untuk 45 soal)
Nilai benar: 210/225
```

### 4. Admin Question Management
**File:** `src/screens/Admin/QuestionsManagement.tsx`

Menambahkan fitur input pembobotan TKP:

#### Form Input
- Section baru "Pembobotan TKP (5-0)" muncul ketika kategori = TKP
- 5 dropdown untuk memilih skor (0-5) untuk setiap opsi A-E
- Default: A=5, B=4, C=3, D=2, E=1
- Visual menggunakan background orange untuk membedakan dari soal lain

#### Tampilan List Soal
- Menampilkan badge dengan poin di sebelah setiap opsi jawaban TKP
- Badge berwarna orange untuk membedakan dari soal TWK/TIU

## Contoh Penggunaan

### Membuat Soal TKP Baru
1. Buka Admin Dashboard → Kelola Soal
2. Klik "Tambah Soal"
3. Pilih Kategori: TKP
4. Isi pertanyaan dan pilihan jawaban
5. Di section "Pembobotan TKP", atur skor untuk setiap pilihan:
   - Opsi A: 5 (jawaban terbaik)
   - Opsi B: 4
   - Opsi C: 3
   - Opsi D: 2
   - Opsi E: 1 (jawaban terburuk)
6. Klik "Tambah Soal"

### Hasil Penilaian
Jika try out memiliki 45 soal TKP:
- Total maksimal: 45 × 5 = 225 poin
- Jika peserta menjawab:
  - 20 soal dengan skor 5 = 100 poin
  - 15 soal dengan skor 4 = 60 poin
  - 10 soal dengan skor 3 = 30 poin
- Total skor TKP: 190 poin
- Ditampilkan: "190 / 225"

## Migrasi Data Lama

Soal TKP yang sudah ada tanpa field `tkpScoring` akan tetap berfungsi:
- Sistem akan menghitung skor 0 untuk soal tanpa pembobotan
- Admin perlu mengedit soal TKP lama untuk menambahkan pembobotan

## Catatan Penting

1. **Backward Compatibility**: Soal lama tanpa `tkpScoring` tidak akan error, tapi skornya akan 0
2. **Passing Grade**: Passing grade TKP perlu disesuaikan dengan sistem baru (misal: 166 untuk sistem lama)
3. **Data Migration**: Untuk best practice, edit semua soal TKP yang ada untuk menambahkan pembobotan
