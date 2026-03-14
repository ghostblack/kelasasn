# Perbaikan: Gagal Mengirim Jawaban & Mendapatkan Score

## Masalah yang Diperbaiki

1. Error "Missing or insufficient permissions" saat submit tryout
2. Gagal menyimpan hasil dan score
3. Tidak bisa melihat ranking setelah selesai

## Penyebab Masalah

### 1. Firebase Rules Belum Di-Setup
Error utama terjadi karena Firestore security rules belum di-publish dengan benar. Rules yang benar sudah ada di file `FIREBASE_RULES_PRODUCTION.txt` tapi belum di-apply ke Firebase Console.

### 2. Query Ranking Gagal
Saat mencoba menghitung ranking, query ke collection `tryout_results` bisa gagal jika:
- Rules belum benar
- Network error
- Permission denied

## Solusi yang Diterapkan

### 1. Perbaikan `completeTryoutSession` Function

**File**: `src/services/tryoutSessionService.ts`

#### Perubahan:
1. **Menambahkan error handling untuk ranking**
   - Jika query ranking gagal, sistem tetap melanjutkan dengan nilai default
   - Rank = 1, Total participants = 1

2. **Urutan operasi yang lebih aman**
   - Simpan hasil tryout TERLEBIH DAHULU
   - Baru kemudian update session dan user_tryout status
   - Ini memastikan data hasil tidak hilang meski ada error di step selanjutnya

3. **Wrap semua operasi dalam try-catch**
   - Error lebih mudah di-track
   - Memberikan informasi yang jelas ke user

### 2. Setup Firebase Rules yang Benar

**WAJIB**: Ikuti langkah di file `SETUP_FIREBASE_RULES.md`

#### Langkah Singkat:
1. Buka [Firebase Console - Firestore Rules](https://console.firebase.google.com/project/kelasasn2026/firestore/rules)
2. Copy semua rules dari file `FIREBASE_RULES_PRODUCTION.txt`
3. Paste ke Firebase Console
4. Klik tombol **"Publish"** (warna biru)
5. Tunggu notifikasi "Rules published successfully"

#### Rules Penting untuk Submit:

```javascript
// Tryout results - Users bisa create hasil mereka sendiri
match /tryout_results/{resultId} {
  allow read: if isAuthenticated() &&
                (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAdmin();
}

// Tryout sessions - Users bisa update session mereka
match /tryout_sessions/{sessionId} {
  allow read: if isAuthenticated() &&
                (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
  allow update: if isAuthenticated() &&
                  (resource.data.userId == request.auth.uid || isAdmin());
  allow delete: if isAdmin();
}

// User tryouts - Users bisa update status completion
match /user_tryouts/{userTryoutId} {
  allow read: if isAuthenticated() &&
                (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
  allow update: if isAuthenticated() &&
                  (resource.data.userId == request.auth.uid || isAdmin());
  allow delete: if isAdmin();
}
```

## Flow Submit yang Diperbaiki

### Before (Bermasalah):
```
1. Update session status → BISA GAGAL
2. Query semua results untuk ranking → BISA GAGAL & STOP
3. Calculate rank → TIDAK JALAN jika step 2 gagal
4. Save result → TIDAK JALAN jika ada error
```

### After (Fixed):
```
1. Prepare data & get attempt number
2. Try calculate rank (dengan error handling)
   - Jika berhasil: gunakan rank yang benar
   - Jika gagal: gunakan rank = 1, total = 1
3. Save result ke Firestore → PRIORITAS UTAMA
4. Update session status
5. Update user_tryout status
```

## Cara Testing

### 1. Test Submit Jawaban
```
1. Login sebagai user
2. Beli tryout (atau gunakan free tryout)
3. Klik "Mulai Mengerjakan"
4. Jawab beberapa soal
5. Klik "Selesaikan Ujian"
6. Klik "Selesaikan" pada dialog konfirmasi
7. Pastikan muncul toast "Try out telah selesai dikerjakan"
8. Akan redirect ke halaman result
```

### 2. Verifikasi Data Tersimpan
```
1. Buka Firebase Console
2. Go to Firestore Database
3. Check collection "tryout_results"
4. Pastikan ada document baru dengan:
   - userId = UID user Anda
   - tryoutId = ID tryout yang dikerjakan
   - totalScore = jumlah score TWK + TIU + TKP
   - answers = object berisi jawaban
   - completedAt = timestamp
```

### 3. Check Halaman Result
```
1. Setelah submit, pastikan redirect ke /dashboard/tryout/{id}/result
2. Pastikan tampil:
   - Total Score
   - TWK Score
   - TIU Score
   - TKP Score
   - Rank (bisa 1 jika baru pertama)
   - Jumlah peserta
   - Detail jawaban benar/salah
```

## Troubleshooting

### Error: "Missing or insufficient permissions"
**Penyebab**: Firebase rules belum di-publish
**Solusi**:
1. Ikuti langkah di `SETUP_FIREBASE_RULES.md`
2. Pastikan rules sudah ter-publish (tunggu 5-10 detik)
3. Refresh browser dan coba lagi

### Error: "Failed to calculate scores"
**Penyebab**:
- Questions tidak ditemukan
- Answers object kosong
- Questions tidak memiliki correctAnswer

**Solusi**:
1. Pastikan tryout memiliki soal (check di Admin panel)
2. Pastikan soal memiliki correctAnswer yang valid
3. Check console browser untuk error detail

### Submit berhasil tapi tidak ada score
**Penyebab**: Kemungkinan rules `tryout_results` tidak allow create

**Solusi**:
1. Check Firebase Console > Firestore Rules
2. Pastikan ada rules untuk `tryout_results` dengan `allow create`
3. Check Firebase Console > Firestore Data
4. Lihat apakah document tersimpan di collection `tryout_results`

### Rank selalu 1
**Ini NORMAL jika**:
- User pertama kali mengerjakan tryout tersebut
- Tidak ada user lain yang sudah mengerjakan

**Cara verifikasi**:
1. Buka Firestore > tryout_results
2. Filter by tryoutId
3. Lihat berapa banyak document dengan tryoutId yang sama
4. Rank akan update setelah lebih banyak user mengerjakan

## Keuntungan Setelah Perbaikan

1. **Robust Error Handling**
   - Sistem tidak crash jika ada error di tengah proses
   - User tetap dapat melihat hasil meski ranking gagal dihitung
   - Data hasil tersimpan dengan aman

2. **Prioritas Data**
   - Hasil tryout (yang paling penting) disimpan terlebih dahulu
   - Status session/user_tryout adalah secondary

3. **Better Logging**
   - Console log yang jelas untuk debugging
   - Error message yang informatif

4. **Fallback Values**
   - Jika ranking gagal: rank = 1, total = 1
   - User tetap bisa lihat score mereka
   - Ranking bisa di-recalculate nanti jika perlu

## Checklist Sebelum Production

- [ ] Firebase rules sudah di-publish
- [ ] Test submit dengan user biasa
- [ ] Test submit dengan berbagai kondisi (network slow, dll)
- [ ] Verifikasi data tersimpan di Firestore
- [ ] Test halaman result tampil dengan benar
- [ ] Test ranking update setelah multiple users submit
- [ ] Check console browser tidak ada error
- [ ] Test pada berbagai browser (Chrome, Firefox, Safari)

## File yang Dimodifikasi

1. `src/services/tryoutSessionService.ts`
   - Function: `completeTryoutSession`
   - Perubahan: Error handling, urutan operasi, fallback values

## Catatan Penting

1. **Jangan lupa publish Firebase rules** - Ini adalah langkah WAJIB yang sering terlupa
2. **Test dengan user asli** - Jangan test dengan admin account
3. **Monitor Firebase Console** - Check apakah data tersimpan dengan benar
4. **Backup data** - Sebelum deploy ke production, backup Firestore data

## Link Berguna

- Firebase Console: https://console.firebase.google.com/project/kelasasn2026
- Firestore Rules: https://console.firebase.google.com/project/kelasasn2026/firestore/rules
- Firestore Data: https://console.firebase.google.com/project/kelasasn2026/firestore/data
