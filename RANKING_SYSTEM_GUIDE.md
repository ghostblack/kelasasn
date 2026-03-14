# Panduan Sistem Ranking

## Cara Kerja Sistem Ranking

Sistem ranking di KelasASN mengambil data dari Firebase Firestore dan menampilkan peringkat peserta berdasarkan skor tryout tertinggi mereka.

### Sumber Data

Data ranking diambil dari collection Firebase:
- **Collection**: `tryout_results`
- **Data yang digunakan**:
  - `userId`: ID user yang mengerjakan tryout
  - `tryoutId`: ID tryout yang dikerjakan
  - `tryoutName`: Nama tryout
  - `totalScore`: Total skor (TWK + TIU + TKP)
  - `twkScore`, `tiuScore`, `tkpScore`: Skor per kategori
  - `completedAt`: Waktu penyelesaian tryout

### Algoritma Ranking

1. **Ambil semua hasil tryout** dari Firebase collection `tryout_results`
2. **Filter berdasarkan tryout** (jika filter tryout dipilih)
3. **Ambil skor tertinggi per user**:
   - Jika user mengerjakan tryout yang sama berkali-kali, hanya skor tertinggi yang digunakan
   - Jika skor sama, yang lebih dulu selesai mendapat peringkat lebih tinggi
4. **Urutkan berdasarkan skor** (tertinggi ke terendah)
5. **Berikan ranking** (1, 2, 3, dst)

### File Terkait

1. **Service**: `/src/services/rankingService.ts`
   - `getRankingByTryout()`: Mengambil dan mengurutkan data ranking
   - `getUserRankInTryout()`: Mendapatkan ranking user spesifik

2. **UI Page**: `/src/screens/Dashboard/RankingPage.tsx`
   - Menampilkan daftar ranking
   - Filter berdasarkan tryout
   - Highlight user yang sedang login

3. **Session Service**: `/src/services/tryoutSessionService.ts`
   - `completeTryoutSession()`: Menyimpan hasil tryout ke Firebase

## Kenapa Ranking Kosong?

Jika ranking tidak muncul, kemungkinan penyebabnya:

### 1. **Belum Ada Data Hasil Tryout**
   - Collection `tryout_results` di Firebase masih kosong
   - Belum ada user yang menyelesaikan tryout

**Solusi**: User harus menyelesaikan tryout terlebih dahulu

### 2. **Data Tidak Tersimpan Dengan Benar**
   - Ada error saat menyimpan hasil tryout
   - Format data tidak sesuai

**Cara Cek**:
```javascript
// Buka console browser dan jalankan:
import { collection, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

const results = await getDocs(collection(db, 'tryout_results'));
console.log('Total results:', results.size);
results.forEach(doc => console.log(doc.id, doc.data()));
```

## Debug Ranking

Gunakan file `debug-ranking-data.html` untuk:
1. **Cek Data Tryout Results**: Melihat semua data hasil tryout
2. **Cek Data Users**: Melihat semua user terdaftar
3. **Cek Data Tryouts**: Melihat semua tryout yang tersedia
4. **Generate Sample Data**: Membuat data sample untuk testing

### Cara Menggunakan Debug Tool:

1. Buka file `debug-ranking-data.html` di browser
2. Klik tombol sesuai yang ingin dicek
3. Jika collection kosong, klik "Generate Sample Data" untuk membuat data testing

## Struktur Data Firebase

### Collection: `tryout_results`

```javascript
{
  userId: "string",              // ID user dari Firebase Auth
  tryoutId: "string",            // ID tryout
  tryoutName: "string",          // Nama tryout
  totalScore: number,            // Total skor (TWK + TIU + TKP)
  twkScore: number,              // Skor TWK
  tiuScore: number,              // Skor TIU
  tkpScore: number,              // Skor TKP
  twkCorrect: number,            // Jumlah benar TWK
  tiuCorrect: number,            // Jumlah benar TIU
  tkpCorrect: number,            // Jumlah benar TKP
  twkTotal: number,              // Total soal TWK
  tiuTotal: number,              // Total soal TIU
  tkpTotal: number,              // Total soal TKP
  rank: number,                  // Ranking saat itu
  totalParticipants: number,     // Total peserta saat itu
  answers: {},                   // Jawaban user
  attemptNumber: number,         // Percobaan ke berapa
  completedAt: Timestamp         // Waktu selesai
}
```

## Fitur Ranking

### 1. Filter Tryout
- **"Semua Try Out"**: Menampilkan ranking dari semua tryout
  - Mengambil skor tertinggi per user per tryout
  - User bisa muncul berkali-kali jika mengerjakan tryout berbeda

- **Pilih Tryout Spesifik**: Menampilkan ranking untuk tryout tertentu saja
  - Hanya menampilkan user yang mengerjakan tryout tersebut
  - Skor terbaik user di tryout tersebut

### 2. Highlight User
- User yang sedang login akan ditandai dengan:
  - Background biru muda
  - Border biru
  - Badge "You"
  - Label "Anda"

### 3. Informasi yang Ditampilkan
- **Rank**: Peringkat (dengan ikon untuk top 3)
  - 🏆 Rank 1: Trophy emas
  - 🥈 Rank 2: Medal perak
  - 🥉 Rank 3: Medal perunggu
- **Avatar**: Inisial dari email user
- **Nama/Email**: Disamarkan (3 karakter pertama + ***)
- **Tryout Name**: Nama tryout yang dikerjakan
- **Skor**: Total skor / 2080 (maksimal skor)
- **Tanggal**: Tanggal penyelesaian

## Testing Ranking

### Langkah Testing:

1. **Pastikan ada data user**:
   ```
   - Login/Register minimal 2-3 user berbeda
   ```

2. **Selesaikan tryout**:
   ```
   - Pilih tryout dari halaman Tryouts
   - Klaim tryout (gratis atau berbayar)
   - Kerjakan dan selesaikan tryout
   - Lihat hasil di Result Page
   ```

3. **Cek ranking**:
   ```
   - Buka halaman Ranking
   - Pilih "Semua Try Out" atau tryout spesifik
   - Ranking harus muncul dengan skor yang benar
   ```

4. **Verifikasi urutan**:
   ```
   - User dengan skor tertinggi harus di rank 1
   - Urutan harus dari tertinggi ke terendah
   - Jika ada skor sama, yang selesai lebih dulu lebih tinggi
   ```

## Troubleshooting

### Problem: Ranking tidak muncul

**Cek**:
1. Buka browser console (F12)
2. Lihat log dari `getRankingByTryout`
3. Cari pesan:
   - ✓ "Found tryout_results: X" - Berapa banyak data ditemukan
   - ⚠ "No tryout results found" - Collection kosong
   - ⚠ "Collection: tryout_results is empty" - Belum ada data

**Solusi**:
- Jika collection kosong: Selesaikan minimal 1 tryout
- Jika ada data tapi tidak muncul: Cek console untuk error

### Problem: Ranking tidak urut dengan benar

**Cek**:
1. Lihat log "=== Best results per user ===" di console
2. Lihat log "=== Sorted results (top 5) ===" di console
3. Pastikan totalScore benar

**Solusi**:
- Jika skor tidak benar: Cek perhitungan skor di `tryoutSessionService.ts`
- Jika urutan salah: Cek sorting algorithm di `rankingService.ts`

### Problem: User muncul berkali-kali

**Expected Behavior**:
- Jika filter "Semua Try Out": User bisa muncul berkali-kali (1x per tryout)
- Jika filter tryout spesifik: User hanya muncul 1x (skor terbaik)

## Maintenance

### Update Algoritma Ranking

Jika perlu mengubah cara ranking dihitung, edit file:
`/src/services/rankingService.ts`

Fungsi utama: `getRankingByTryout()`

### Update UI Ranking

Jika perlu mengubah tampilan ranking, edit file:
`/src/screens/Dashboard/RankingPage.tsx`

### Log Debugging

Sistem ranking sudah dilengkapi dengan extensive logging:
- Setiap langkah proses tercatat di console
- Mudah untuk tracking issue
- Dapat dinonaktifkan di production dengan menghapus `console.log()`

## Kesimpulan

Sistem ranking bekerja dengan cara:
1. ✓ Mengambil data dari Firebase collection `tryout_results`
2. ✓ Memilih skor tertinggi per user per tryout
3. ✓ Mengurutkan berdasarkan skor (tertinggi ke terendah)
4. ✓ Memberikan ranking (1, 2, 3, dst)
5. ✓ Menampilkan di UI dengan informasi lengkap

Data ranking **real-time** dari Firebase dan **otomatis terupdate** setiap kali ada user yang menyelesaikan tryout.
