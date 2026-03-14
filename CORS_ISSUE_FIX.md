# Fix CORS Issue - Google Apps Script

## Masalah CORS yang Terjadi

Dari screenshot yang Anda berikan, terlihat error CORS di browser:
- **Request URL**: `https://script.google.com/macros/s/.../exec`
- **Response Headers**: (0) - tidak ada response
- **Status**: Error CORS

### Kenapa CORS Error Terjadi?

Google Apps Script secara default **TIDAK** menambahkan CORS headers pada response. Ini menyebabkan browser memblok request dari aplikasi web kita.

**Gejala:**
- Request ke Apps Script tampak berhasil di Network tab
- Tapi tidak ada response headers
- Console menampilkan error CORS
- Halaman payment tidak menampilkan metode pembayaran

## Penyebab Utama

Google Apps Script memiliki keterbatasan:
1. **Tidak bisa set custom HTTP headers** langsung seperti server biasa
2. **CORS harus di-handle** dengan deployment setting yang benar
3. **Perlu setting akses "Anyone"** pada deployment

## Solusi yang Sudah Diterapkan

### 1. Update Google Apps Script Code

File `google-apps-script/TripayProxy.gs` telah diupdate dengan:

```javascript
// CORS HANDLER
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function createJsonResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
```

### 2. Handle OPTIONS Request (Preflight)

```javascript
function doGet(e) {
  // Handle CORS preflight
  if (e.parameter.method === 'OPTIONS') {
    return createJsonResponse({ success: true, message: 'CORS OK' });
  }
  // ... rest of code
}
```

## Langkah-Langkah Deploy Ulang Apps Script

**PENTING:** Setelah mengupdate code, Anda HARUS deploy ulang!

### Step 1: Update Code di Apps Script

1. Buka Google Apps Script Editor: https://script.google.com
2. Pilih project Anda (atau buat baru)
3. **DELETE semua code lama**
4. Copy **SEMUA code** dari file `google-apps-script/TripayProxy.gs`
5. Paste di Apps Script Editor
6. Klik **Save** (ikon disk atau Ctrl+S)

### Step 2: Setup Script Properties

1. Di Apps Script Editor, klik **Project Settings** (⚙️ di sidebar kiri)
2. Scroll ke bawah ke bagian **Script Properties**
3. Klik **Add script property** dan tambahkan:

   ```
   TRIPAY_API_KEY_SANDBOX = DEV-D7T1aMwz66CRCUp1AfMtX28aNnI3kr1CS2FGiWc0
   TRIPAY_PRIVATE_KEY_SANDBOX = KDo45-rfo1e-eVdb9-uM9LU-rGm4W
   TRIPAY_MERCHANT_CODE_SANDBOX = T46118
   ENVIRONMENT = sandbox
   ```

**ATAU** jalankan function `setupScriptProperties()`:
1. Di toolbar atas, pilih function: **setupScriptProperties**
2. Klik **Run**
3. Authorize jika diminta

### Step 3: Deploy as Web App

**SANGAT PENTING - Setting harus benar!**

1. Klik tombol **Deploy** > **New deployment**
2. Klik icon **⚙️ Select type** > pilih **Web app**
3. Isi form deployment:
   - **Description**: Tripay Payment Proxy v1.1 (atau versi baru)
   - **Execute as**: **Me** (email Anda)
   - **Who has access**: **Anyone** ⚠️ **HARUS ANYONE!**
4. Klik **Deploy**
5. Authorize jika diminta (klik Review permissions)
6. **COPY URL DEPLOYMENT** yang muncul

### Step 4: Test Deployment

Setelah deploy, test dengan curl atau browser:

```bash
# Test 1: Direct browser
# Buka URL ini di browser:
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?path=payment-channels

# Test 2: Menggunakan curl
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?path=payment-channels"

# Harusnya return JSON dengan list payment channels
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "code": "QRIS",
        "name": "QRIS",
        ...
      }
    ]
  }
}
```

### Step 5: Update .env di Project

1. Buka file `.env` di project
2. Update `VITE_TRIPAY_APPS_SCRIPT_URL` dengan URL deployment baru:

```env
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec
```

3. Save file `.env`

### Step 6: Restart Development Server

```bash
# Stop server (Ctrl+C)
# Start lagi
npm run dev
```

## Troubleshooting CORS

### Problem 1: Masih Ada Error CORS Setelah Deploy Ulang

**Kemungkinan Penyebab:**
1. Setting "Who has access" BUKAN "Anyone"
2. URL deployment lama masih dipakai
3. Browser cache

**Solusi:**
1. Pastikan deployment setting:
   - Deploy > Manage deployments
   - Edit deployment
   - Pastikan "Who has access" = **Anyone**
   - Save

2. Clear browser cache:
   - Chrome: DevTools > Network tab > **Disable cache** (checkbox)
   - Hard refresh: Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac)

3. Test dengan Incognito/Private window

### Problem 2: Error "Authorization required"

**Penyebab:** Setting "Execute as" salah atau "Who has access" bukan "Anyone"

**Solusi:**
1. Buat deployment baru
2. Pastikan:
   - Execute as: **Me**
   - Who has access: **Anyone**

### Problem 3: Response Tetap Kosong

**Cek di Apps Script:**
1. View > Executions
2. Lihat log error
3. Cek apakah function dipanggil

**Cek di Browser:**
1. Buka DevTools > Network tab
2. Cari request ke Apps Script
3. Klik request tersebut
4. Lihat:
   - Response tab: apa isi response?
   - Headers tab: apa ada CORS error?

## Alternative: Gunakan JSONP (Jika CORS Tetap Gagal)

Jika CORS masih bermasalah, kita bisa gunakan JSONP sebagai alternatif.

### Update Apps Script untuk JSONP:

```javascript
function doGet(e) {
  const callback = e.parameter.callback;
  const path = e.parameter.path;

  let result;

  try {
    if (path === 'payment-channels') {
      result = getPaymentChannels();
    }
    // ... rest of code

    // Return JSONP
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return createJsonResponse(result);
  } catch (e) {
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify({success: false, error: e.toString()}) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return createJsonResponse({success: false, error: e.toString()});
  }
}
```

## Verifikasi Final

Setelah semua langkah di atas:

1. ✅ Apps Script code sudah diupdate dengan CORS handler
2. ✅ Script Properties sudah diisi
3. ✅ Deploy dengan setting "Anyone"
4. ✅ URL deployment baru sudah di `.env`
5. ✅ Development server sudah restart
6. ✅ Test di browser: halaman payment muncul dengan metode pembayaran

## Checklist Deployment

- [ ] Update code Apps Script dengan code terbaru
- [ ] Setup Script Properties atau run `setupScriptProperties()`
- [ ] Deploy dengan "Execute as: Me" dan "Who has access: Anyone"
- [ ] Test URL deployment di browser langsung
- [ ] Update `.env` dengan URL deployment baru
- [ ] Restart development server
- [ ] Test halaman payment di aplikasi
- [ ] Clear browser cache jika perlu
- [ ] Verify di Network tab browser (harus ada response)

## Catatan Penting

### Google Apps Script Limitations

Google Apps Script **TIDAK BISA** menambahkan custom HTTP headers seperti:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- dll.

**TETAPI**, dengan setting deployment "Who has access: Anyone", Google Apps Script secara otomatis menangani CORS di level platform.

### Alternatif Jika Masih Bermasalah

Jika setelah semua langkah masih ada masalah CORS:

1. **Gunakan Cloud Functions** (Firebase Functions, Vercel Functions, dll)
2. **Setup proxy server** sendiri (Node.js/Express)
3. **Gunakan layanan proxy** seperti CORS Anywhere

## Kontak Support

Jika masih ada masalah:
1. Screenshot error di browser console
2. Screenshot Network tab di DevTools
3. Screenshot log di Apps Script (View > Executions)
4. Share URL deployment untuk dicek

---

**Update terakhir**: 2025-10-23
**Status**: CORS handler ditambahkan, perlu deploy ulang Apps Script
