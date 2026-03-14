// --- [KONFIGURASI WAJIB] ---
// Kredensial Tripay Sandbox
const MERCHANT_CODE = 'T46118';
const API_KEY = 'DEV-pnxETy9k3YyvbbzJ6heBhEp6dLuZqQT0yHARLTAy';
const PRIVATE_KEY = '09Kcz-WsrHJ-CcRWU-loP7N-Xght0';
const TRIPAY_SANDBOX_URL = 'https://tripay.co.id/api-sandbox';

// Nama Sheet untuk logging
const LOG_SHEET_TRANSACTIONS = 'TransactionLogs';
const LOG_SHEET_CALLBACKS = 'CallbackLogs';
// --- [AKHIR KONFIGURASI] ---


/**
 * Helper function untuk mengubah byte array (dari signature) menjadi hex string.
 * @param {byte[]} bytes - Byte array.
 * @return {string} Hex string.
 */
function bytesToHex(bytes) {
  return bytes.map(byte => {
    return (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, '0');
  }).join('');
}

/**
 * Helper function untuk mencatat log ke Google Sheet.
 * @param {string} sheetName - Nama sheet (tab).
 * @param {Object} data - Data yang akan dicatat.
 */
function logToSheet(sheetName, data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(['Timestamp', 'Data (JSON String)']);
    }

    sheet.appendRow([new Date(), JSON.stringify(data)]);

  } catch (e) {
    Logger.log('Gagal mencatat ke Sheet: ' + e.message);
  }
}

/**
 * Helper function untuk memanggil Tripay API
 */
function callTripayAPI(endpoint, method, payload) {
  const url = TRIPAY_SANDBOX_URL + endpoint;

  const options = {
    method: method,
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + API_KEY
    },
    muteHttpExceptions: true
  };

  if (payload && method.toLowerCase() !== 'get') {
    options.payload = JSON.stringify(payload);
  }

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    Logger.log('Tripay Response Code: ' + responseCode);
    Logger.log('Tripay Response: ' + responseBody);

    return {
      success: responseCode >= 200 && responseCode < 300,
      statusCode: responseCode,
      data: JSON.parse(responseBody)
    };
  } catch (e) {
    Logger.log('Error calling Tripay API: ' + e.toString());
    return {
      success: false,
      message: e.toString()
    };
  }
}

/**
 * Endpoint Utama untuk Frontend.
 * Dipanggil saat ada request GET ke URL Web App.
 */
function doGet(e) {
  const action = e.parameter.action;

  // 1. GET PAYMENT CHANNELS
  if (action === 'getPaymentChannels') {
    try {
      const result = callTripayAPI('/merchant/payment-channel', 'get', null);

      logToSheet(LOG_SHEET_TRANSACTIONS, {
        type: 'Get Payment Channels',
        result: result
      });

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      logToSheet(LOG_SHEET_TRANSACTIONS, {
        type: 'Error Get Payment Channels',
        message: err.message
      });
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: 'Terjadi error: ' + err.message })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 2. CREATE TRANSACTION
  if (action === 'createTransaction') {
    try {
      const amount = parseInt(e.parameter.amount, 10);
      const method = e.parameter.method;
      const customerName = e.parameter.name || 'Pelanggan';
      const customerEmail = e.parameter.email || 'pelanggan@example.com';
      const customerPhone = e.parameter.phone || '081234567890';

      if (!amount || !method) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: 'Parameter amount & method wajib diisi' })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const merchantRef = `MY-ORDER-${Date.now()}`;

      // Buat Signature
      const stringToSign = MERCHANT_CODE + merchantRef + amount;
      const signatureBytes = Utilities.computeHmacSha256Signature(stringToSign, PRIVATE_KEY);
      const signature = bytesToHex(signatureBytes);

      // Siapkan payload
      const payload = {
        method: method,
        merchant_ref: merchantRef,
        amount: amount,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        order_items: [
          {
            sku: 'TRYOUT-01',
            name: 'Tryout CPNS',
            price: amount,
            quantity: 1
          }
        ],
        callback_url: ScriptApp.getService().getUrl(),
        return_url: 'https://website-anda.com/terima-kasih',
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        signature: signature
      };

      logToSheet(LOG_SHEET_TRANSACTIONS, { type: 'Request', payload: payload });

      const result = callTripayAPI('/transaction/create', 'post', payload);

      logToSheet(LOG_SHEET_TRANSACTIONS, { type: 'Response', result: result });

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      logToSheet(LOG_SHEET_TRANSACTIONS, { type: 'Error', message: err.message });
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: 'Terjadi error internal: ' + err.message })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 3. GET TRANSACTION DETAIL
  if (action === 'getTransactionDetail') {
    try {
      const reference = e.parameter.reference;

      if (!reference) {
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: 'Parameter reference wajib diisi' })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      const result = callTripayAPI('/transaction/detail?reference=' + reference, 'get', null);

      logToSheet(LOG_SHEET_TRANSACTIONS, {
        type: 'Get Transaction Detail',
        reference: reference,
        result: result
      });

      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      logToSheet(LOG_SHEET_TRANSACTIONS, {
        type: 'Error Get Transaction Detail',
        message: err.message
      });
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: 'Terjadi error: ' + err.message })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 4. JIKA TIDAK ADA AKSI
  return ContentService.createTextOutput(
    'Backend Tripay Aktif. Gunakan parameter ?action=[getPaymentChannels|createTransaction|getTransactionDetail]'
  );
}


/**
 * Endpoint Backend untuk Callback dari Tripay.
 * Dipanggil saat ada request POST ke URL Web App.
 */
function doPost(e) {
  let signature = '';
  try {
    signature = e.request.headers['x-signature'];
    const rawBody = e.postData.contents;

    // Validasi Signature
    const signatureBytes = Utilities.computeHmacSha256Signature(rawBody, PRIVATE_KEY);
    const calculatedSignature = bytesToHex(signatureBytes);

    if (signature !== calculatedSignature) {
      logToSheet(LOG_SHEET_CALLBACKS, {
        type: 'Error',
        message: 'Invalid Signature',
        received: signature,
        calculated: calculatedSignature
      });
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: 'Invalid Signature' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(rawBody);

    logToSheet(LOG_SHEET_CALLBACKS, { type: 'Callback Valid', data: data });

    const status = data.status;
    const merchantRef = data.merchant_ref;

    if (status === 'PAID') {
      logToSheet(LOG_SHEET_CALLBACKS, { type: 'Status Update', ref: merchantRef, status: 'LUNAS' });
      // TODO: Update database/firestore untuk status PAID

    } else if (status === 'EXPIRED' || status === 'FAILED') {
      logToSheet(LOG_SHEET_CALLBACKS, { type: 'Status Update', ref: merchantRef, status: 'GAGAL' });
      // TODO: Update database/firestore untuk status EXPIRED/FAILED
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logToSheet(LOG_SHEET_CALLBACKS, { type: 'Error Global', message: err.message, signature: signature });
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: 'Internal Server Error: ' + err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
