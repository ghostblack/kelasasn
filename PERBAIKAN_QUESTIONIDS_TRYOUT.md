# Perbaikan QuestionIds Tryout

## Masalah Yang Ditemukan

Tryout tidak tersedia (belum bisa dibeli atau dibuka) meskipun:
- Jumlah soal sudah sesuai di admin
- Tryout sudah diaktifkan
- Soal sudah ditambahkan ke database

### Akar Masalah

Ketika admin menambahkan soal ke tryout, soal hanya disimpan di koleksi `questions`, tetapi **field `questionIds` di dokumen tryout tidak diupdate**. Akibatnya:

1. Di `TryoutDetailPage.tsx` ada pengecekan:
   ```typescript
   const hasQuestions = tryout.questionIds && tryout.questionIds.length > 0;
   ```

2. Jika `questionIds` kosong, tryout akan tampil dengan pesan "Try Out Belum Siap" dan tombol disabled.

## Solusi Yang Diterapkan

### 1. Update TryoutQuestionInput.tsx
Ketika admin membuat soal baru, soal akan otomatis ditambahkan ke `questionIds` tryout:

```typescript
const newQuestionId = await createQuestion(questionData);

if (tryoutId) {
  const { addQuestionToTryout } = await import('@/services/questionService');
  await addQuestionToTryout(tryoutId, newQuestionId);
}
```

### 2. Tambah Fungsi di questionService.ts

**addQuestionToTryout** - Menambahkan ID soal ke array questionIds tryout:
```typescript
export const addQuestionToTryout = async (tryoutId: string, questionId: string): Promise<void> => {
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (!tryoutSnap.exists()) {
    throw new Error('Tryout tidak ditemukan');
  }

  const currentQuestionIds = tryoutSnap.data().questionIds || [];

  if (currentQuestionIds.includes(questionId)) {
    return; // Sudah ada, tidak perlu ditambahkan lagi
  }

  await updateDoc(tryoutRef, {
    questionIds: [...currentQuestionIds, questionId],
    updatedAt: serverTimestamp(),
  });
};
```

**removeQuestionFromTryout** - Menghapus ID soal dari array questionIds ketika soal dihapus:
```typescript
export const removeQuestionFromTryout = async (tryoutId: string, questionId: string): Promise<void> => {
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (!tryoutSnap.exists()) {
    throw new Error('Tryout tidak ditemukan');
  }

  const currentQuestionIds = tryoutSnap.data().questionIds || [];
  const updatedQuestionIds = currentQuestionIds.filter((id: string) => id !== questionId);

  await updateDoc(tryoutRef, {
    questionIds: updatedQuestionIds,
    updatedAt: serverTimestamp(),
  });
};
```

### 3. Update TryoutQuestionList.tsx
Ketika admin menghapus soal, ID soal juga dihapus dari tryout:

```typescript
const handleDelete = async (questionId: string) => {
  await deleteQuestion(questionId);

  if (tryoutId) {
    const { removeQuestionFromTryout } = await import('@/services/questionService');
    await removeQuestionFromTryout(tryoutId, questionId);
  }
};
```

### 4. Tool Perbaikan untuk Tryout Lama

Dibuat file `fix-tryout-questions.html` untuk memperbaiki tryout yang sudah ada:

**Fitur:**
- Cek status semua tryout
- Tampilkan tryout mana yang perlu diperbaiki
- Otomatis menambahkan soal TWK, TIU, dan TKP ke questionIds
- Update jumlah soal per kategori

**Cara Menggunakan:**
1. Buka `fix-tryout-questions.html` di browser
2. Klik "Cek Status Tryout" untuk melihat tryout mana yang bermasalah
3. Klik "Perbaiki Tryout" untuk menambahkan soal ke questionIds

## Alur Kerja Baru

### Menambah Soal Baru
1. Admin masuk ke halaman input soal
2. Admin mengisi form soal
3. Klik "Simpan" atau "Simpan & Tambah Baru"
4. **Otomatis**: Soal disimpan ke koleksi `questions`
5. **Otomatis**: ID soal ditambahkan ke `questionIds` tryout
6. Tryout sekarang memiliki soal dan bisa dibeli/dibuka

### Menghapus Soal
1. Admin masuk ke halaman daftar soal
2. Klik tombol hapus pada soal
3. **Otomatis**: Soal dihapus dari koleksi `questions`
4. **Otomatis**: ID soal dihapus dari `questionIds` tryout
5. Jumlah soal tryout berkurang secara otomatis

## Cara Memperbaiki Tryout Lama

Jika ada tryout yang sudah dibuat sebelumnya dan soalnya belum masuk ke `questionIds`:

### Opsi 1: Manual via Firestore Console
1. Buka Firebase Console → Firestore
2. Buka koleksi `tryout_packages`
3. Pilih dokumen tryout yang bermasalah
4. Buka koleksi `questions` dan copy semua ID soal TWK, TIU, TKP
5. Update field `questionIds` dengan array berisi ID-ID soal tersebut

### Opsi 2: Menggunakan Tool HTML (Recommended)
1. Buka `fix-tryout-questions.html` di browser
2. Klik "Cek Status Tryout"
3. Lihat tryout mana yang ditandai "⚠️ Perlu Diperbaiki"
4. Klik "Perbaiki Tryout"
5. Tool akan otomatis:
   - Mengambil soal TWK, TIU, TKP sesuai jumlah yang dibutuhkan
   - Menambahkan ID soal ke `questionIds`
   - Update jumlah soal per kategori

### Opsi 3: Tambah Ulang Soal dari Admin
1. Login sebagai admin
2. Masuk ke tryout yang bermasalah
3. Buka kategori soal (TWK/TIU/TKP)
4. Buat soal baru (sistem otomatis akan menambahkan ke questionIds)

## Verifikasi

Setelah perbaikan, verifikasi dengan:

1. **Cek di Admin:**
   - Buka management tryout
   - Pastikan jumlah soal sesuai

2. **Cek di User:**
   - Logout dari admin
   - Login sebagai user biasa
   - Masuk ke halaman Tryouts
   - Tryout seharusnya sudah tampil dan bisa dibeli/diklaim

3. **Cek Detail:**
   - Klik "Selengkapnya" pada tryout
   - Seharusnya tidak ada pesan "Try Out Belum Siap"
   - Tombol "Klaim Gratis" atau "Beli Sekarang" aktif

## Checklist Troubleshooting

Jika tryout masih belum tersedia:

- [ ] Apakah tryout sudah diaktifkan (isActive = true)?
- [ ] Apakah field `questionIds` tidak kosong?
- [ ] Apakah jumlah soal di `questionIds` sesuai dengan totalQuestions?
- [ ] Apakah soal-soal yang direferensikan di `questionIds` ada di koleksi `questions`?
- [ ] Apakah browser cache sudah di-refresh?

## Kesimpulan

Dengan perbaikan ini:
- ✅ Soal otomatis masuk ke tryout saat dibuat
- ✅ Soal otomatis dihapus dari tryout saat dihapus
- ✅ Tryout langsung tersedia setelah soal ditambahkan
- ✅ Tidak perlu lagi update manual di Firestore
- ✅ Ada tool untuk memperbaiki tryout lama
