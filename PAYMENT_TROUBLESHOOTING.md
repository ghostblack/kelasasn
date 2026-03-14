# Troubleshooting Pembayaran

## Masalah Umum

### 1. Perbedaan Harga yang Ditampilkan

**Pertanyaan**: Mengapa harga yang admin input (misalnya Rp 5.000) berbeda dengan harga final (misalnya Rp 4.xxx)?

**Penjelasan**:
- Sistem pembayaran menggunakan Tripay sebagai payment gateway
- Tripay menambahkan biaya admin (`fee_customer`) pada setiap transaksi
- Biaya admin ini DITAMBAHKAN ke harga dasar, bukan dikurangi
- Yang pelanggan bayar = Harga Try Out + Biaya Admin

**Contoh**:
```
Harga Try Out: Rp 5.000
Biaya Admin (2%): Rp 100
Total Pembayaran: Rp 5.100
```

**Catatan**:
- Biaya admin berbeda-beda tergantung metode pembayaran yang dipilih
- Ada yang gratis (0%), ada yang 2%, 2.5%, dll
- Biaya ini TRANSPARAN dan ditampilkan sebelum customer membayar

### 2. Halaman Pembayaran Error/Tidak Bisa Dibuka

**Kemungkinan Penyebab**:

#### A. API Tripay Tidak Dapat Diakses
- Endpoint `/api/tripay` belum dikonfigurasi
- Koneksi ke server Tripay bermasalah
- API key atau merchant code salah

**Solusi**:
1. Periksa konfigurasi di `src/services/tripayService.ts`:
   ```typescript
   const TRIPAY_BASE_URL = '/api/tripay';
   const TRIPAY_API_KEY = 'your-api-key';
   const TRIPAY_PRIVATE_KEY = 'your-private-key';
   const TRIPAY_MERCHANT_CODE = 'your-merchant-code';
   ```

2. Pastikan endpoint API proxy sudah berjalan
3. Test koneksi dengan file `test-tripay.html`

#### B. Try Out Tidak Ditemukan
- Try out ID tidak valid
- Try out sudah dihapus atau non-aktif

**Solusi**:
- Pastikan Try Out masih aktif di Admin Dashboard
- Periksa ID Try Out yang diakses

#### C. Metode Pembayaran Tidak Tersedia
- Koneksi ke Tripay API gagal
- Tidak ada payment channel yang aktif

**Solusi**:
- System sekarang akan menampilkan peringatan jika metode pembayaran tidak tersedia
- Halaman tetap bisa dibuka meskipun tanpa metode pembayaran
- Refresh halaman untuk mencoba lagi

### 3. Memahami Flow Harga

```
┌─────────────────────────────────────────────┐
│ ADMIN INPUT                                  │
│ Harga Try Out: Rp 5.000                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ CUSTOMER MELIHAT HARGA                       │
│ - Harga Try Out: Rp 5.000                   │
│ - Biaya Admin: Rp xxx (tergantung metode)   │
│ - Total: Rp 5.xxx                           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ TRIPAY MEMPROSES                             │
│ - Amount yang dikirim ke Tripay: Rp 5.xxx   │
│ - Fee customer: Rp xxx                       │
│ - Merchant terima: sesuai kesepakatan       │
└──────────────────────────────────────────────┘
```

## Cara Mengecek Error

### 1. Buka Console Browser
- Tekan F12 atau klik kanan → Inspect
- Buka tab Console
- Cari error message berwarna merah

### 2. Error Umum dan Solusinya

**Error**: "Gagal memuat data pembayaran"
- **Penyebab**: Tidak bisa fetch data try out atau payment channels
- **Solusi**: Periksa koneksi internet dan Firebase config

**Error**: "Tidak ada metode pembayaran yang tersedia"
- **Penyebab**: Gagal load payment channels dari Tripay
- **Solusi**: Periksa API Tripay configuration

**Error**: "Mohon lengkapi semua data pembayaran"
- **Penyebab**: Field nama atau nomor WA kosong
- **Solusi**: Isi semua field yang required

## Testing Pembayaran

1. **Test dengan Sandbox Tripay**:
   - Gunakan mode sandbox untuk testing
   - Tidak ada transaksi real yang terjadi
   - Bisa test semua metode pembayaran

2. **Test Flow**:
   ```
   1. Pilih Try Out
   2. Klik "Beli Sekarang"
   3. Isi data pembeli
   4. Pilih metode pembayaran
   5. Periksa ringkasan harga
   6. Klik "Bayar Sekarang"
   7. Redirect ke halaman pembayaran
   ```

## Monitoring Transaksi

### Di Admin Dashboard
1. Buka Admin Dashboard
2. Lihat riwayat transaksi
3. Periksa status pembayaran

### Di Firebase Console
1. Buka Firestore
2. Collection: `payment_transactions`
3. Periksa field:
   - `amount`: Harga asli try out
   - `fee`: Biaya admin
   - `totalAmount`: Total yang dibayar customer
   - `status`: Status pembayaran

## FAQ

**Q: Kenapa biaya admin bisa berbeda-beda?**
A: Setiap metode pembayaran punya tarif berbeda dari Tripay. VA Bank biasanya lebih murah daripada E-wallet.

**Q: Apakah customer bisa pilih metode pembayaran tanpa biaya admin?**
A: Ya, beberapa metode pembayaran tidak memiliki biaya admin (ditandai dengan badge "Gratis").

**Q: Bagaimana jika customer komplain soal harga?**
A: Jelaskan bahwa biaya admin sudah TRANSPARAN ditampilkan sebelum checkout, dan ini adalah biaya dari payment gateway.

**Q: Apakah admin bisa mengatur biaya admin?**
A: Tidak, biaya admin ditentukan oleh Tripay sebagai payment gateway. Admin hanya bisa menentukan harga dasar try out.

## Update Terbaru

### Perbaikan yang Sudah Dilakukan:

1. ✅ **Error Handling yang Lebih Baik**
   - Halaman tidak crash jika payment channels gagal load
   - Menampilkan warning jika metode pembayaran tidak tersedia
   - User masih bisa lihat detail try out

2. ✅ **Transparansi Harga**
   - Biaya admin ditampilkan dengan jelas
   - Total pembayaran di-highlight dengan font besar
   - Penjelasan bahwa biaya admin bervariasi

3. ✅ **Logging yang Lebih Detail**
   - Console log mencatat semua step pembayaran
   - Memudahkan debugging saat ada error
   - Tracking amount asli vs amount final

4. ✅ **Konsistensi Data**
   - Amount yang disimpan ke Firestore adalah amount yang dikembalikan Tripay
   - Memastikan data konsisten dengan Tripay records
   - Fee customer dicatat terpisah untuk tracking

## Kontak Support

Jika masih ada masalah:
1. Screenshot error message di console
2. Screenshot halaman yang error
3. Catat langkah-langkah yang dilakukan sebelum error
4. Hubungi tim teknis
