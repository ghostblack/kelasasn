# Setup Tripay dengan Google Apps Script

## 📋 Ringkasan
Dokumentasi ini menjelaskan cara setup payment gateway Tripay menggunakan Google Apps Script sebagai proxy API yang aman. Dengan setup ini, Anda dapat:
- ✅ Menyembunyikan API Key dan Private Key dari frontend
- ✅ Mudah switch antara Sandbox dan Production
- ✅ Mengelola webhook callback dengan aman
- ✅ Monitoring transaksi dengan log

## 🚀 Langkah Setup

### 1. Deploy Google Apps Script

1. **Buka Google Apps Script**
   - Kunjungi: https://script.google.com
   - Login dengan akun Google Anda

2. **Buat Project Baru**
   - Klik "New project"
   - Beri nama: "Tripay Payment Gateway Proxy"

3. **Copy Code**
   - Buka file: `google-apps-script/TripayProxy.gs`
   - Copy semua code
   - Paste ke editor Google Apps Script
   - Hapus default code yang ada

4. **Setup Konfigurasi**
   - Di menu atas, pilih function: `setupScriptProperties`
   - Klik tombol "Run" (▶️)
   - Authorize aplikasi jika diminta
   - Cek Execution log untuk memastikan berhasil

5. **Deploy sebagai Web App**
   - Klik "Deploy" > "New deployment"
   - Klik icon gear ⚙️ > pilih "Web app"
   - Setting:
     - Description: "Tripay Payment Proxy v1"
     - Execute as: "Me"
     - Who has access: "Anyone"
   - Klik "Deploy"
   - **PENTING**: Copy URL yang muncul (contoh: `https://script.google.com/macros/s/AKfycby.../exec`)
   - Simpan URL ini untuk konfigurasi frontend

### 2. Update Frontend Configuration

#### File: `src/config/tripay.config.ts` (Buat file baru)

```typescript
// Konfigurasi Tripay menggunakan Google Apps Script Proxy
export const TRIPAY_CONFIG = {
  // URL Apps Script yang sudah di-deploy
  appsScriptUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  // Environment akan dikelola dari Apps Script
  // Anda tidak perlu API key di frontend lagi!
} as const;

export const TRIPAY_ENDPOINTS = {
  paymentChannels: '?path=payment-channels',
  createTransaction: '?path=create-transaction',
  transactionDetail: '?path=transaction-detail',
} as const;
```

### 3. Update Service Files

#### File: `src/services/tripayService.ts`

Ganti dengan:

```typescript
import { TripayPaymentChannel, TripayTransaction } from '@/types';
import { TRIPAY_CONFIG, TRIPAY_ENDPOINTS } from '@/config/tripay.config';

const BASE_URL = TRIPAY_CONFIG.appsScriptUrl;

export const getPaymentChannels = async (): Promise<TripayPaymentChannel[]> => {
  try {
    const response = await fetch(`${BASE_URL}${TRIPAY_ENDPOINTS.paymentChannels}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || result.data?.message || 'Failed to fetch payment channels');
    }

    return result.data.data;
  } catch (error) {
    console.error('Error fetching payment channels:', error);
    throw error;
  }
};

interface CreateTransactionParams {
  method: string;
  merchantRef: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderItems: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  callbackUrl?: string;
  returnUrl?: string;
  expiredTime?: number;
}

export const createTransaction = async (
  params: CreateTransactionParams
): Promise<TripayTransaction> => {
  try {
    const payload = {
      method: params.method,
      merchant_ref: params.merchantRef,
      amount: params.amount,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
      customer_phone: params.customerPhone,
      order_items: params.orderItems,
      callback_url: params.callbackUrl || `${window.location.origin}/api/tripay/callback`,
      return_url: params.returnUrl || `${window.location.origin}/dashboard/payment-success`,
      expired_time: params.expiredTime || Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    };

    const response = await fetch(`${BASE_URL}${TRIPAY_ENDPOINTS.createTransaction}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || result.data?.message || 'Failed to create transaction');
    }

    return result.data.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const getTransactionDetail = async (reference: string): Promise<TripayTransaction> => {
  try {
    const response = await fetch(
      `${BASE_URL}${TRIPAY_ENDPOINTS.transactionDetail}&reference=${reference}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || result.data?.message || 'Failed to fetch transaction detail');
    }

    return result.data.data;
  } catch (error) {
    console.error('Error fetching transaction detail:', error);
    throw error;
  }
};

export const calculateFee = (amount: number, channel: TripayPaymentChannel): number => {
  const flatFee = channel.fee_customer.flat;
  const percentFee = (amount * channel.fee_customer.percent) / 100;
  const totalFee = flatFee + percentFee;

  return Math.max(totalFee, channel.minimum_fee);
};
```

### 4. Testing Sandbox

#### Di Google Apps Script Console:

1. **Test Get Payment Channels**
   - Pilih function: `testGetPaymentChannels`
   - Klik "Run"
   - Cek Execution log untuk melihat hasil

2. **Test Create Transaction**
   - Pilih function: `testCreateTransaction`
   - Klik "Run"
   - Cek Execution log untuk melihat hasil

3. **Check Environment**
   - Pilih function: `getCurrentEnvironment`
   - Klik "Run"
   - Pastikan environment = "sandbox"

#### Di Frontend:

```bash
npm run dev
```

- Login ke aplikasi
- Pilih tryout dan coba pembayaran
- Gunakan metode QRIS atau Virtual Account
- Verifikasi payment berhasil dibuat

### 5. Migrasi ke Production

Ketika sudah siap untuk production:

#### A. Dapatkan Credentials Production

1. Login ke Tripay Dashboard Production
2. Navigasi ke: Settings > API Key
3. Copy:
   - API Key Production
   - Private Key Production
   - Merchant Code Production

#### B. Update Script Properties

Di Google Apps Script:

1. Klik "Project Settings" (⚙️ di sidebar kiri)
2. Scroll ke "Script Properties"
3. Klik "Edit script properties"
4. Update nilai:
   - `TRIPAY_API_KEY_PROD`: [Your Production API Key]
   - `TRIPAY_PRIVATE_KEY_PROD`: [Your Production Private Key]
   - `TRIPAY_MERCHANT_CODE_PROD`: [Your Production Merchant Code]

#### C. Switch Environment

Jalankan function: `switchToProduction`
- Pilih function dropdown: `switchToProduction`
- Klik "Run"
- Cek log: "Environment switched to PRODUCTION"

#### D. Verify Production

Jalankan function: `getCurrentEnvironment`
- Pastikan output:
  - environment: "production"
  - baseUrl: "https://tripay.co.id/api"

### 6. Setup Webhook Callback

Untuk menerima notifikasi otomatis dari Tripay:

1. **Di Tripay Dashboard**
   - Masuk ke Settings > Callback URL
   - Set URL: `https://script.google.com/macros/s/YOUR_ID/exec?action=callback`
   - Save

2. **Webhook akan otomatis:**
   - Verifikasi signature
   - Log transaksi
   - Bisa di-forward ke sistem Anda

## 🔧 Troubleshooting

### Error: "Script requires authorization"
**Solusi**:
- Klik "Review permissions"
- Login dengan akun Google Anda
- Klik "Advanced" > "Go to ... (unsafe)"
- Klik "Allow"

### Error: "Access denied"
**Solusi**:
- Pastikan deployment setting "Who has access" = "Anyone"
- Re-deploy jika perlu

### Payment channels tidak muncul
**Solusi**:
- Cek Execution log di Apps Script
- Pastikan API Key valid
- Cek environment sudah benar (sandbox/production)

### Signature invalid saat create transaction
**Solusi**:
- Pastikan Merchant Code, API Key, dan Private Key match
- Pastikan tidak ada spasi atau karakter tersembunyi
- Re-check Script Properties

## 📊 Monitoring

### Melihat Log Transaksi

Di Google Apps Script:
1. Klik "Executions" di sidebar kiri
2. Lihat semua request yang masuk
3. Klik detail untuk melihat log lengkap

### Melihat Script Properties

1. Klik "Project Settings" (⚙️)
2. Scroll ke "Script Properties"
3. Lihat semua konfigurasi

## 🔐 Security Best Practices

1. ✅ API Key dan Private Key TIDAK ada di frontend code
2. ✅ Semua request melalui Apps Script proxy
3. ✅ Signature verification untuk callback
4. ✅ Environment terpisah (sandbox vs production)
5. ✅ Easy rollback jika ada masalah (switch ke sandbox)

## 🎯 Checklist Pre-Production

Sebelum go-live ke production:

- [ ] Test semua metode pembayaran di sandbox
- [ ] Verifikasi callback webhook berfungsi
- [ ] Test error handling (expired, failed payment)
- [ ] Backup Script Properties
- [ ] Dapatkan credentials production dari Tripay
- [ ] Update Script Properties dengan credentials production
- [ ] Deploy new version jika ada perubahan code
- [ ] Switch environment ke production
- [ ] Test 1 transaksi production dengan nominal kecil
- [ ] Monitor log untuk memastikan tidak ada error
- [ ] Update callback URL di Tripay dashboard production

## 📞 Support

Jika ada masalah:
1. Cek Execution log di Apps Script
2. Cek Browser console untuk error frontend
3. Verifikasi Script Properties sudah benar
4. Test individual functions di Apps Script
5. Hubungi support Tripay jika masalah di API mereka

---

**Created**: 2025-01-23
**Last Updated**: 2025-01-23
**Version**: 1.0
