# Fitur Riwayat Pembayaran

## Deskripsi
Fitur riwayat pembayaran memungkinkan user untuk melihat semua transaksi pembelian tryout, melanjutkan pembayaran yang belum selesai, dan memeriksa status pembayaran secara real-time.

## Fitur Utama

### 1. Halaman Riwayat Pembayaran
- Menampilkan semua transaksi pembelian user
- Filter berdasarkan status: Semua, Menunggu, Berhasil, Gagal
- Informasi lengkap setiap transaksi:
  - Nama tryout
  - Tanggal transaksi
  - Metode pembayaran
  - Total pembayaran
  - Status pembayaran
  - Referensi pembayaran
  - Waktu kadaluarsa (untuk pending)

### 2. Lanjutkan Pembayaran
- User dapat melanjutkan pembayaran yang belum selesai
- Tombol "Lanjut Bayar" tersedia untuk transaksi pending yang belum expired
- Link langsung ke checkout Tripay

### 3. Cek Status Pembayaran
- Tombol "Cek Status" untuk memeriksa status pembayaran ke Tripay
- Auto-check status setiap 30 detik di halaman payment process
- Update status otomatis (PAID, FAILED, EXPIRED)

### 4. Notifikasi Badge
- Badge merah di menu "Riwayat Pembayaran" menampilkan jumlah pembayaran pending
- Auto-refresh setiap 1 menit
- Menghilang ketika tidak ada pembayaran pending

### 5. Auto-Expire
- Sistem otomatis mengubah status UNPAID menjadi EXPIRED jika melewati waktu kadaluarsa
- Pengecekan dilakukan saat:
  - Load halaman riwayat
  - Cek status manual
  - Load data user payments

## Alur Penggunaan

### Melanjutkan Pembayaran Pending
1. User membuka halaman Riwayat Pembayaran
2. Sistem menampilkan semua transaksi dengan filter
3. Untuk transaksi pending (UNPAID), tersedia:
   - Waktu tersisa sebelum expired
   - Tombol "Lanjut Bayar" (jika belum expired)
   - Tombol "Cek Status"
4. User klik "Lanjut Bayar" untuk membuka checkout Tripay
5. User melakukan pembayaran di Tripay
6. User klik "Cek Status" atau tunggu auto-check
7. Sistem update status ke PAID dan unlock tryout

### Memeriksa Status Pembayaran
1. User klik tombol "Cek Status" pada transaksi
2. Sistem request ke Tripay API untuk mendapatkan status terbaru
3. Sistem update status di database
4. Jika PAID, sistem otomatis:
   - Update status transaksi
   - Tambahkan tryout ke user_tryouts
   - Tampilkan notifikasi sukses
5. User diarahkan ke halaman tryout atau tetap di riwayat

## Integrasi dengan Tripay (Sandbox)

### Endpoint yang Digunakan
- `GET /merchant/payment-channel` - Daftar metode pembayaran
- `POST /transaction/create` - Buat transaksi
- `GET /transaction/detail` - Cek status transaksi

### Status Mapping
- `UNPAID` - Menunggu pembayaran
- `PAID` - Pembayaran berhasil
- `FAILED` - Pembayaran gagal
- `EXPIRED` - Waktu pembayaran habis

### Auto-Check Payment
Sistem melakukan pengecekan otomatis:
- Di halaman Payment Process: setiap 30 detik
- Badge notifikasi: setiap 60 detik
- Manual check: saat user klik tombol "Cek Status"

## Database Schema

### Collection: payment_transactions
```
{
  id: string
  userId: string
  tryoutId: string
  tryoutName: string
  amount: number
  fee: number
  totalAmount: number
  reference: string (unique)
  merchantRef: string
  paymentMethod: string
  paymentMethodCode: string
  status: 'UNPAID' | 'PAID' | 'FAILED' | 'EXPIRED'
  payUrl: string | null
  checkoutUrl: string | null
  qrUrl: string | null
  expiredTime: Date
  createdAt: Date
  updatedAt: Date
  paidAt: Date | null
}
```

## Testing Mode (Sandbox)

Di halaman Payment Process, tersedia tombol "Simulasi Pembayaran Berhasil" untuk testing:
- Langsung ubah status menjadi PAID
- Unlock tryout untuk user
- Redirect ke halaman success

Mode ini hanya untuk development/sandbox dan akan dihapus saat production.

## Navigasi

### Menu Sidebar
- Home
- List Try Out
- **Riwayat Pembayaran** (dengan badge pending)
- Ranking
- Daftar Jabatan

### Akses Halaman
- URL: `/dashboard/payment-history`
- Protected Route: Ya (memerlukan login)
- Layout: DashboardLayout

## Fitur Tambahan

### Filter Status
- Tab "Semua" - Semua transaksi
- Tab "Menunggu" - UNPAID yang belum expired
- Tab "Berhasil" - PAID
- Tab "Gagal" - FAILED, EXPIRED, atau UNPAID yang sudah expired

### Empty State
Menampilkan pesan yang sesuai ketika tidak ada transaksi:
- Belum ada transaksi sama sekali
- Tidak ada transaksi untuk filter tertentu
- Tombol CTA ke halaman tryout

### Responsive Design
- Mobile: Layout vertical, full width
- Tablet: Grid 1 kolom
- Desktop: Grid 1 kolom, max-width container

## Update yang Dilakukan

1. **File Baru**
   - `src/screens/Dashboard/PaymentHistoryPage.tsx`

2. **File Dimodifikasi**
   - `src/components/layout/DashboardLayout.tsx` - Tambah menu dan badge
   - `src/services/paymentService.ts` - Tambah auto-expire logic
   - `src/screens/Dashboard/PaymentProcessPage.tsx` - Auto-check status
   - `src/screens/Dashboard/PaymentSuccessPage.tsx` - Link ke riwayat
   - `src/screens/Dashboard/index.ts` - Export PaymentHistoryPage
   - `src/index.tsx` - Route baru
   - `src/lib/utils.ts` - Fungsi formatCurrency

3. **Dependency**
   - Tidak ada dependency baru

## Keamanan

### RLS (Row Level Security)
Data pembayaran hanya dapat diakses oleh user pemilik:
```sql
CREATE POLICY "Users can view own payments"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = userId);
```

### Validasi
- User ID validasi di backend
- Reference unik untuk setiap transaksi
- Expired time validation
- Status validation sebelum unlock tryout
