# 📸 Visual Setup Guide - Tripay Apps Script

Panduan visual langkah demi langkah dengan penjelasan detail untuk setup Tripay Payment Gateway.

## 🎯 Overview

```
┌─────────────────┐
│   Frontend      │
│   (React App)   │
└────────┬────────┘
         │
         │ fetch()
         ▼
┌─────────────────────────────┐
│  Google Apps Script Proxy   │
│  - Menyimpan API Keys       │
│  - Generate Signature       │
│  - Forward ke Tripay API    │
└────────┬────────────────────┘
         │
         │ HTTPS + Signature
         ▼
┌─────────────────┐
│   Tripay API    │
│  - Sandbox      │
│  - Production   │
└─────────────────┘
```

## 📝 Step-by-Step Setup

### Step 1: Buka Google Apps Script

1. Browser → https://script.google.com
2. Login dengan Google Account
3. Tampilan awal akan menampilkan projects Anda (jika ada)

```
┌────────────────────────────────────────┐
│  Apps Script                     [🔍]  │
├────────────────────────────────────────┤
│                                        │
│  My Projects                           │
│                                        │
│  ┌────────────────────────────────┐   │
│  │   [+ New project]              │   │
│  └────────────────────────────────┘   │
│                                        │
│  Recent Projects:                      │
│  - Project 1                           │
│  - Project 2                           │
│                                        │
└────────────────────────────────────────┘
```

### Step 2: Buat Project Baru

1. Klik tombol "**+ New project**"
2. Editor akan terbuka dengan file `Code.gs` default

```
┌────────────────────────────────────────┐
│  Untitled project              [💾] [▶]│
├────────────────────────────────────────┤
│  Files                   Services      │
│  📄 Code.gs                            │
│                                        │
├────────────────────────────────────────┤
│  function myFunction() {               │
│    // Type your code here              │
│  }                                     │
│                                        │
└────────────────────────────────────────┘
```

3. Rename project:
   - Klik "**Untitled project**" di atas
   - Ganti nama: "**Tripay Payment Gateway Proxy**"
   - Nama akan otomatis tersimpan

### Step 3: Copy Code

1. Buka file: `google-apps-script/TripayProxy.gs` dari repository
2. Select All (Ctrl+A) dan Copy (Ctrl+C)
3. Kembali ke Apps Script editor
4. Hapus semua code default
5. Paste code yang sudah di-copy (Ctrl+V)

```
┌────────────────────────────────────────┐
│  Tripay Payment Gateway Proxy  [💾] [▶]│
├────────────────────────────────────────┤
│  Files                                 │
│  📄 TripayProxy.gs                     │
│                                        │
├────────────────────────────────────────┤
│  /**                                   │
│   * TRIPAY PAYMENT GATEWAY PROXY      │
│   * Google Apps Script...             │
│   */                                   │
│                                        │
│  function getConfig() {                │
│    const scriptProperties = ...       │
│  }                                     │
│                                        │
└────────────────────────────────────────┘
```

4. Save dengan:
   - Klik icon 💾 (Save), atau
   - Ctrl+S, atau
   - File → Save

### Step 4: Setup Script Properties

1. Di editor, perhatikan dropdown function di atas (default: "Select function")

```
┌────────────────────────────────────────┐
│  [Select function ▼]           [▶ Run] │
└────────────────────────────────────────┘
```

2. Klik dropdown dan scroll sampai menemukan: **`setupScriptProperties`**
3. Pilih `setupScriptProperties`

```
┌────────────────────────────────────────┐
│  [setupScriptProperties ▼]     [▶ Run] │
└────────────────────────────────────────┘
```

4. Klik tombol **[▶ Run]**
5. **PENTING**: Pertama kali akan muncul dialog authorization:

```
┌────────────────────────────────────────┐
│  Authorization Required                │
├────────────────────────────────────────┤
│  This project needs permission to:     │
│  - Read and write properties          │
│                                        │
│  [Review Permissions]                  │
└────────────────────────────────────────┘
```

6. Klik **[Review Permissions]**
7. Pilih Google Account Anda
8. Akan muncul warning "Google hasn't verified this app":
   - Klik "**Advanced**"
   - Klik "**Go to Tripay Payment Gateway Proxy (unsafe)**"
   - Klik "**Allow**"

9. Setelah authorized, function akan berjalan
10. Cek Execution log (bawah editor):

```
┌────────────────────────────────────────┐
│  Execution log                         │
├────────────────────────────────────────┤
│  ✓ Execution completed                 │
│  Script properties berhasil di-setup!  │
│  Current environment: sandbox          │
└────────────────────────────────────────┘
```

### Step 5: Deploy sebagai Web App

1. Klik tombol **"Deploy"** (pojok kanan atas)
2. Pilih **"New deployment"**

```
┌────────────────────────────────────────┐
│  Deploy                                │
├────────────────────────────────────────┤
│  ● New deployment                      │
│  ○ Manage deployments                  │
│  ○ Test deployments                    │
└────────────────────────────────────────┘
```

3. Dialog "New deployment" akan muncul
4. Klik icon **⚙️** (Settings) di samping "Select type"

```
┌────────────────────────────────────────┐
│  New deployment                        │
├────────────────────────────────────────┤
│  Select type:   [⚙️ Settings ▼]       │
│                                        │
│  Available types:                      │
│  ● Web app                            │
│  ● API Executable                      │
│  ● Add-on                             │
└────────────────────────────────────────┘
```

5. Pilih **"Web app"**
6. Isi form deployment:

```
┌────────────────────────────────────────┐
│  New deployment - Web app              │
├────────────────────────────────────────┤
│  Description (optional):               │
│  [Tripay Payment Proxy v1        ]     │
│                                        │
│  Execute as:                           │
│  [Me (yourname@gmail.com)        ▼]    │
│                                        │
│  Who has access:                       │
│  [Anyone                         ▼]    │
│                                        │
│  [Cancel]              [Deploy]        │
└────────────────────────────────────────┘
```

**PENTING**: Pastikan setting:
- **Execute as**: `Me (email Anda)`
- **Who has access**: `Anyone`

7. Klik **[Deploy]**
8. Akan muncul konfirmasi dengan URL:

```
┌────────────────────────────────────────┐
│  Deployment successful!                │
├────────────────────────────────────────┤
│  Web app URL:                          │
│  https://script.google.com/macros/s/   │
│  AKfycbxXXXXXXXXXXXXXXXXXXXXXXX/exec  │
│                                        │
│  [Copy]                      [Done]    │
└────────────────────────────────────────┘
```

9. **COPY URL ini** - Anda akan membutuhkannya!
10. Klik **[Done]**

### Step 6: Update Environment Variable

1. Buka project Anda
2. Edit file `.env`
3. Paste URL yang di-copy tadi:

```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJhb...

# Tripay Payment Gateway Configuration
# URL Google Apps Script yang sudah di-deploy
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxXXXX/exec
```

4. Save file `.env`

### Step 7: Test di Apps Script Console

Kembali ke Apps Script editor untuk testing:

#### Test 1: Get Payment Channels

1. Dropdown function → Pilih: **`testGetPaymentChannels`**
2. Klik **[▶ Run]**
3. Cek Execution log:

```
┌────────────────────────────────────────┐
│  Execution log                         │
├────────────────────────────────────────┤
│  Tripay Response Code: 200             │
│  Tripay Response: {"success":true,...} │
│  {                                     │
│    "success": true,                    │
│    "data": [                           │
│      {                                 │
│        "code": "QRIS",                 │
│        "name": "QRIS",                 │
│        "group": "E-Wallet",           │
│        ...                             │
│      }                                 │
│    ]                                   │
│  }                                     │
└────────────────────────────────────────┘
```

✅ Jika muncul data channels → **SUKSES!**
❌ Jika error → Cek API Key di Script Properties

#### Test 2: Create Transaction

1. Dropdown function → Pilih: **`testCreateTransaction`**
2. Klik **[▶ Run]**
3. Cek Execution log:

```
┌────────────────────────────────────────┐
│  Execution log                         │
├────────────────────────────────────────┤
│  Creating transaction with payload: {  │
│    "method": "QRIS",                   │
│    "merchant_ref": "TEST-1234567890",  │
│    "amount": 50000,                    │
│    ...                                 │
│  }                                     │
│  Tripay Response Code: 200             │
│  {                                     │
│    "success": true,                    │
│    "data": {                           │
│      "reference": "T46118...",         │
│      "status": "UNPAID",              │
│      "pay_url": "https://...",        │
│      ...                               │
│    }                                   │
│  }                                     │
└────────────────────────────────────────┘
```

✅ Jika muncul reference & pay_url → **SUKSES!**
❌ Jika error signature → Cek Private Key

#### Test 3: Check Environment

1. Dropdown function → Pilih: **`getCurrentEnvironment`**
2. Klik **[▶ Run]**
3. Cek Execution log:

```
┌────────────────────────────────────────┐
│  Execution log                         │
├────────────────────────────────────────┤
│  Current environment: sandbox          │
│  Base URL: https://tripay.co.id/api-   │
│            sandbox                     │
│  Merchant Code: T46118                 │
└────────────────────────────────────────┘
```

✅ Pastikan environment = **sandbox** untuk testing

### Step 8: Test di Frontend

1. Buka terminal
2. Run development server:

```bash
npm run dev
```

3. Buka browser → http://localhost:5173
4. Login ke aplikasi
5. Test flow pembayaran:

```
User Flow:
┌──────────────┐
│ Login        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Pilih Tryout │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Klik "Beli"  │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Pilih Metode Bayar  │
│ - QRIS              │
│ - Virtual Account   │
│ - E-Wallet          │
└──────┬──────────────┘
       │
       ▼
┌──────────────┐
│ Klik "Bayar" │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ Payment Page    │
│ - QR Code/VA    │
│ - Instructions  │
│ - Amount        │
└─────────────────┘
```

6. Cek Browser Console (F12) → Tab Console:

```
Console:
✓ Fetching payment channels...
✓ Payment channels loaded: 15 methods
✓ Creating transaction...
✓ Transaction created: T46118...
→ Redirecting to payment page...
```

✅ Jika tidak ada error merah → **SUKSES!**

### Step 9: Verify Script Properties

Untuk memastikan semua config tersimpan dengan benar:

1. Di Apps Script, klik icon **⚙️** (Project Settings) di sidebar kiri
2. Scroll ke section **"Script Properties"**
3. Pastikan ada properties berikut:

```
┌────────────────────────────────────────┐
│  Script Properties                     │
├────────────────────────────────────────┤
│  Property                    Value     │
│  ─────────────────────────────────     │
│  ENVIRONMENT                 sandbox   │
│  TRIPAY_API_KEY_SANDBOX      DEV-D7... │
│  TRIPAY_PRIVATE_KEY_SANDBOX  KDo45-... │
│  TRIPAY_MERCHANT_CODE_SANDBOX T46118   │
│  TRIPAY_API_KEY_PROD         (empty)   │
│  TRIPAY_PRIVATE_KEY_PROD     (empty)   │
│  TRIPAY_MERCHANT_CODE_PROD   (empty)   │
└────────────────────────────────────────┘
```

## 🔄 Switch ke Production (Nanti)

Ketika sudah dapat credentials production:

### 1. Update Script Properties

1. Project Settings (⚙️) → Script Properties
2. Klik "Edit script properties"
3. Update nilai untuk:
   - `TRIPAY_API_KEY_PROD`
   - `TRIPAY_PRIVATE_KEY_PROD`
   - `TRIPAY_MERCHANT_CODE_PROD`
4. Save

### 2. Switch Environment

1. Dropdown function → Pilih: **`switchToProduction`**
2. Klik **[▶ Run]**
3. Cek log: "Environment switched to PRODUCTION"

### 3. Verify

1. Dropdown function → Pilih: **`getCurrentEnvironment`**
2. Cek log:
   - environment = "production"
   - baseUrl = "https://tripay.co.id/api"

## 📊 Monitoring

### Melihat Request Log

1. Klik "Executions" (📊) di sidebar kiri
2. Akan muncul list semua function calls:

```
┌────────────────────────────────────────┐
│  Executions                    [🔄]    │
├────────────────────────────────────────┤
│  Function          Status    Duration  │
│  ──────────────────────────────────    │
│  doGet             ✓         1.2s      │
│  doPost            ✓         2.1s      │
│  getPaymentChannels ✓        0.8s      │
│  createTransaction  ✓        1.5s      │
│  doGet             ✗ Error   0.3s      │
└────────────────────────────────────────┘
```

3. Klik salah satu untuk detail:
   - Request parameters
   - Execution log
   - Error message (jika ada)

## 🐛 Debug Tips

### Jika Payment Channels Tidak Muncul:

**Check 1**: Script Properties
```javascript
// Run function: getCurrentEnvironment
// Output harus ada API Key dan Merchant Code
```

**Check 2**: Execution Log
```
Tripay Response Code: 401 → API Key salah
Tripay Response Code: 403 → IP tidak allowed
Tripay Response Code: 500 → Tripay server error
```

**Check 3**: Network
```javascript
// Di frontend, cek Network tab (F12)
// Find request ke Apps Script URL
// Check response body
```

### Jika Create Transaction Gagal:

**Check Signature**:
```javascript
// Run: testCreateTransaction
// Cek log: "Creating transaction with payload..."
// Verify signature ada dan tidak undefined
```

**Check Amount**:
```
Minimum amount: Rp 10.000
Maximum amount: varies per channel
```

## ✅ Success Indicators

Anda berhasil jika:

- [ ] `testGetPaymentChannels` return data channels
- [ ] `testCreateTransaction` return reference & pay_url
- [ ] `getCurrentEnvironment` show correct environment
- [ ] Frontend dapat load payment channels
- [ ] Frontend dapat create transaction
- [ ] Tidak ada error di browser console
- [ ] Transaksi muncul di Tripay dashboard

## 🎯 Next Steps

Setelah setup berhasil:

1. Test semua metode pembayaran
2. Test expired transaction
3. Test callback webhook
4. Monitor execution log
5. Prepare untuk production migration

---

**Tips**:
- Simpan URL deployment di tempat aman
- Jangan share API Key/Private Key
- Backup Script Properties sebelum update
- Test di sandbox sebelum production
- Monitor log secara rutin

**Need Help?**
- Cek file: `TRIPAY_QUICK_START.md`
- Cek file: `TRIPAY_APPS_SCRIPT_SETUP.md`
- Open test file: `test-tripay-apps-script.html`
