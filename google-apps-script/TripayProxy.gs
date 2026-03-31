/**
 * TRIPAY PAYMENT GATEWAY PROXY
 * Google Apps Script untuk menangani API Tripay
 *
 * =============================================================
 * VERSI PERBAIKAN:
 * 1. Menambahkan fungsi `doOptions(e)` untuk menangani CORS Preflight.
 * 2. Memperbaiki `createJsonResponse` untuk menambahkan header CORS.
 * 3. Menghapus cek `e.parameter.method === 'OPTIONS'` yang salah.
 * 4. Memperbaiki `doPost` untuk membedakan panggilan API (dari frontend)
 * dan panggilan Callback (dari Tripay).
 * =============================================================
 *
 * CARA SETUP:
 * 1. Buka https://script.google.com
 * 2. Buat project baru
 * 3. Copy paste code ini
 * 4. JALANKAN FUNGSI `setupScriptProperties` SEKALI dari editor.
 * 5. Klik "Deploy" > "New deployment" > "Web app"
 * 6. Set "Execute as": Me
 * 7. Set "Who has access": Anyone
 * 8. Copy URL deployment dan simpan
 */

// ============================================
// KONFIGURASI - SET DI SCRIPT PROPERTIES
// ============================================
function getConfig() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const environment = scriptProperties.getProperty('ENVIRONMENT') || 'sandbox';

  if (environment === 'production') {
    return {
      apiKey: scriptProperties.getProperty('TRIPAY_API_KEY_PROD'),
      privateKey: scriptProperties.getProperty('TRIPAY_PRIVATE_KEY_PROD'),
      merchantCode: scriptProperties.getProperty('TRIPAY_MERCHANT_CODE_PROD'),
      baseUrl: 'https://tripay.co.id/api',
      environment: 'production'
    };
  } else {
    // Gunakan kredensial sandbox default jika properties kosong
    return {
      apiKey: scriptProperties.getProperty('TRIPAY_API_KEY_SANDBOX') || 'DEV-pnxETy9k3YyvbbzJ6heBhEp6dLuZqQT0yHARLTAy',
      privateKey: scriptProperties.getProperty('TRIPAY_PRIVATE_KEY_SANDBOX') || '09Kcz-WsrHJ-CcRWU-loP7N-Xght0',
      merchantCode: scriptProperties.getProperty('TRIPAY_MERCHANT_CODE_SANDBOX') || 'T46118',
      baseUrl: 'https://tripay.co.id/api-sandbox',
      environment: 'sandbox'
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateSignature(merchantCode, merchantRef, amount, privateKey) {
  const message = merchantCode + merchantRef + amount;
  const signature = Utilities.computeHmacSha256Signature(message, privateKey);
  return signature.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ("0" + v.toString(16)).slice(-2);
  }).join('');
}

function callTripayApi(endpoint, method, payload) {
  const config = getConfig();
  const url = config.baseUrl + endpoint;

  const headers = {
    'Authorization': 'Bearer ' + config.apiKey,
    'Content-Type': 'application/json'
  };

  const options = {
    'method': method,
    'headers': headers,
    'muteHttpExceptions': true
  };

  if (payload && method.toLowerCase() !== 'get') {
    options.payload = JSON.stringify(payload);
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('Tripay Response Code: ' + responseCode);
    Logger.log('Tripay Response: ' + responseText);

    return {
      success: responseCode >= 200 && responseCode < 300,
      statusCode: responseCode,
      data: JSON.parse(responseText)
    };
  } catch (e) {
    Logger.log('Error calling Tripay API: ' + e.toString());
    return {
      success: false,
      error: e.toString(),
      data: null
    };
  }
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET Payment Channels
 */
function getPaymentChannels() {
  return callTripayApi('/merchant/payment-channel', 'get', null);
}

/**
 * CREATE Transaction
 */
function createTransaction(requestData) {
  const config = getConfig();

  // Validasi data dasar
  if (!requestData.merchant_ref || !requestData.amount || !requestData.method) {
    return { success: false, error: 'merchant_ref, amount, and method are required' };
  }

  // Generate signature
  const signature = generateSignature(
    config.merchantCode,
    requestData.merchant_ref,
    requestData.amount.toString(),
    config.privateKey
  );

  // Prepare payload
  const payload = {
    method: requestData.method,
    merchant_ref: requestData.merchant_ref,
    amount: requestData.amount,
    customer_name: requestData.customer_name,
    customer_email: requestData.customer_email,
    customer_phone: requestData.customer_phone,
    order_items: requestData.order_items,
    callback_url: requestData.callback_url,
    return_url: requestData.return_url,
    expired_time: requestData.expired_time || Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    signature: signature
  };

  Logger.log('Creating transaction with payload: ' + JSON.stringify(payload));

  return callTripayApi('/transaction/create', 'post', payload);
}

/**
 * GET Transaction Detail
 */
function getTransactionDetail(reference) {
  if (!reference) {
    return { success: false, error: 'Reference parameter is required' };
  }
  return callTripayApi('/transaction/detail?reference=' + reference, 'get', null);
}

// ============================================
// JSON/CORS RESPONSE HANDLER
// ============================================

/**
 * [FIXED] Membuat output JSON dan menambahkan header CORS
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// WEB APP HANDLER
// ============================================

/**
 * [NEW] Menangani CORS Preflight OPTIONS requests
 * Ini penting agar browser mengizinkan request POST dari frontend Anda
 */
function doOptions(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "CORS preflight OK" }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * [FIXED] Menangani GET requests
 */
function doGet(e) {
  const path = e.parameter.path;
  const reference = e.parameter.reference;

  let result;

  try {
    if (path === 'payment-channels') {
      result = getPaymentChannels();
    } else if (path === 'transaction-detail') {
      result = getTransactionDetail(reference);
    } else {
      result = {
        success: false,
        error: 'Invalid GET endpoint. Use ?path=payment-channels or ?path=transaction-detail&reference=...'
      };
    }

    return createJsonResponse(result);
  } catch (e) {
    Logger.log('Error in doGet: ' + e.toString());
    return createJsonResponse({
      success: false,
      error: e.toString()
    });
  }
}

/**
 * [FIXED] Menangani POST requests
 * Logika ini sekarang membedakan antara panggilan API (memiliki ?path=...)
 * dan panggilan Webhook (tidak memiliki ?path=...)
 */
function doPost(e) {
  const path = e.parameter.path;

  try {
    // Jika ADA parameter 'path', ini adalah panggilan API dari frontend Anda
    if (path) {
      const requestData = JSON.parse(e.postData.contents);
      let result;

      if (path === 'create-transaction') {
        result = createTransaction(requestData);
      } else {
        result = {
          success: false,
          error: 'Invalid POST endpoint. Use ?path=create-transaction'
        };
      }
      return createJsonResponse(result);
    }
    // Jika TIDAK ADA parameter 'path', ini adalah CALLBACK/WEBHOOK dari Tripay
    else {
      return handleCallback(e);
    }

  } catch (e) {
    Logger.log('Error in doPost: ' + e.toString());
    return createJsonResponse({
      success: false,
      error: e.toString()
    });
  }
}

// ============================================
// CALLBACK HANDLER (untuk webhook dari Tripay)
// ============================================
function handleCallback(e) {
  try {
    const callbackData = JSON.parse(e.postData.contents);
    const config = getConfig();

    // Verifikasi signature callback
    // Header 'Signature' dari Tripay mungkin ada di request 'headers'
    const headers = e.headers || {};
    const callbackSignature = headers['Signature'] || headers['signature'] || callbackData.signature;

    if (!callbackSignature) {
       Logger.log('Callback failed: No signature found in headers or body.');
       return ContentService
         .createTextOutput(JSON.stringify({ success: false, error: 'No signature found' }))
         .setMimeType(ContentService.MimeType.JSON);
    }

    // Data untuk signature callback Tripay adalah JSON body
    const jsonBody = e.postData.contents;

    const expectedSignature = Utilities.computeHmacSha256Signature(jsonBody, config.privateKey);
    const expectedSignatureHex = expectedSignature.map(function(byte) {
      const v = (byte < 0) ? 256 + byte : byte;
      return ("0" + v.toString(16)).slice(-2);
    }).join('');

    Logger.log('Received Signature: ' + callbackSignature);
    Logger.log('Expected Signature: ' + expectedSignatureHex);

    if (callbackSignature !== expectedSignatureHex) {
      Logger.log('Invalid callback signature');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid signature'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Log callback data
    Logger.log('Valid callback received: ' + JSON.stringify(callbackData));

    // =================================================================
    // TODO: PROSES DATA DI SINI
    // Simpan ke Google Sheets, kirim notifikasi, update database, dll.
    // Contoh:
    // const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Logs");
    // sheet.appendRow([
    //   new Date(),
    //   callbackData.status,
    //   callbackData.merchant_ref,
    //   callbackData.total_amount
    // ]);
    // =================================================================

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Callback processed'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    Logger.log('Error handling callback: ' + e.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: e.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ============================================
// ADMIN FUNCTIONS (untuk testing)
// ============================================
function testGetPaymentChannels() {
  const result = getPaymentChannels();
  Logger.log(JSON.stringify(result));
  return result;
}

function testCreateTransaction() {
  const testData = {
    method: 'QRIS',
    merchant_ref: 'TEST-' + Date.now(),
    amount: 50000,
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    customer_phone: '081234567890',
    order_items: [
      {
        name: 'Test Tryout',
        price: 50000,
        quantity: 1
      }
    ],
    callback_url: 'https://your-app.com/api/callback', // Ganti dengan URL webhook Anda (jika ada)
    return_url: 'https://your-app.com/payment-success'
  };

  const result = createTransaction(testData);
  Logger.log(JSON.stringify(result));
  return result;
}

/**
 * Setup Script Properties
 * Jalankan function ini untuk set konfigurasi
 */
function setupScriptProperties() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // SANDBOX Configuration
  scriptProperties.setProperty('TRIPAY_API_KEY_SANDBOX', 'DEV-pnxETy9k3YyvbbzJ6heBhEp6dLuZqQT0yHARLTAy');
  scriptProperties.setProperty('TRIPAY_PRIVATE_KEY_SANDBOX', '09Kcz-WsrHJ-CcRWU-loP7N-Xght0');
  scriptProperties.setProperty('TRIPAY_MERCHANT_CODE_SANDBOX', 'T46118');

  // PRODUCTION Configuration (kosong dulu, isi nanti saat migrasi)
  scriptProperties.setProperty('TRIPAY_API_KEY_PROD', '');
  scriptProperties.setProperty('TRIPAY_PRIVATE_KEY_PROD', '');
  scriptProperties.setProperty('TRIPAY_MERCHANT_CODE_PROD', '');

  // Set environment (sandbox atau production)
  scriptProperties.setProperty('ENVIRONMENT', 'sandbox');

  Logger.log('Script properties berhasil di-setup!');
  Logger.log('Current environment: ' + scriptProperties.getProperty('ENVIRONMENT'));
}

/**
 * Switch ke Production
 * Jalankan setelah credentials production siap
 */
function switchToProduction() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('ENVIRONMENT', 'production');
  Logger.log('Environment switched to PRODUCTION');
}

/**
 * Switch ke Sandbox
 */
function switchToSandbox() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('ENVIRONMENT', 'sandbox');
  Logger.log('Environment switched to SANDBOX');
}

/**
 * Get current environment
 */
function getCurrentEnvironment() {
  const config = getConfig();
  Logger.log('Current environment: ' + config.environment);
  Logger.log('Base URL: ' + config.baseUrl);
  Logger.log('Merchant Code: ' + config.merchantCode);
  return config;
}
