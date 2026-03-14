# ⚡ Payment Quick Fix Guide

## 🚨 Error: "Tripay belum dikonfigurasi"

### 3 Langkah Cepat

#### 1. Deploy Apps Script
```
1. Buka: https://script.google.com
2. New Project → Copy code dari google-apps-script/TripayProxy.gs
3. Run function: setupScriptProperties (authorize jika diminta)
4. Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone
5. COPY URL: https://script.google.com/macros/s/XXXXXX/exec
```

#### 2. Update .env
```bash
# Buka file .env, tambahkan:
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXXX/exec
```

#### 3. Restart Server
```bash
# Ctrl+C untuk stop
npm run dev
```

### ✅ Test
Buka `test-apps-script-connection.html` di browser:
- Paste URL Apps Script
- Klik "Test Koneksi"
- Klik "Test Payment Channels"

---

## 🚨 Error: "Missing or insufficient permissions"

### Firebase Rules Not Set

1. **Firebase Console**: https://console.firebase.google.com
2. **Firestore Database** → Tab "Rules"
3. **Copy dari**: `SETUP_FIREBASE_RULES.md`
4. **Publish**

---

## 📋 Checklist

### Apps Script
- [ ] Deployed as Web App
- [ ] "Anyone" can access
- [ ] `setupScriptProperties()` executed
- [ ] URL format correct: `.../exec`

### Environment
- [ ] `.env` has `VITE_TRIPAY_APPS_SCRIPT_URL`
- [ ] Dev server restarted
- [ ] No typos in URL

### Firebase
- [ ] Rules published
- [ ] User logged in
- [ ] Collections readable

---

## 🔧 Still Not Working?

### Check Console
```javascript
// Browser console:
console.log(import.meta.env.VITE_TRIPAY_APPS_SCRIPT_URL);
// Should print: https://script.google.com/macros/s/.../exec
```

### Manual Test
```bash
# Terminal:
curl "https://script.google.com/macros/s/XXXXXX/exec?path=payment-channels"
```

### Re-deploy
1. Apps Script → Deploy → Manage deployments
2. Create new deployment (new URL)
3. Update `.env` with new URL
4. Restart server

---

## 📞 Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| "Tripay belum dikonfigurasi" | URL not set | Add to `.env` & restart |
| "Missing permissions" | Firebase rules | Update & publish rules |
| "Invalid signature" | Wrong credentials | Check Apps Script properties |
| "Network error" | Firewall/CORS | Check Apps Script "Anyone" access |
| "Cannot read properties" | Not logged in | Login to app first |

---

## 🎯 Environment Format

**CORRECT:**
```env
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxXXXXXXXX/exec
```

**WRONG:**
```env
VITE_TRIPAY_APPS_SCRIPT_URL=
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com
VITE_TRIPAY_APPS_SCRIPT_URL = https://... (spaces)
```

---

## 📱 File Locations

- **Apps Script Code**: `google-apps-script/TripayProxy.gs`
- **Environment File**: `.env` (root project)
- **Test Tool**: `test-apps-script-connection.html`
- **Firebase Rules**: `SETUP_FIREBASE_RULES.md`
- **Full Guide**: `TROUBLESHOOTING_PAYMENT.md`
