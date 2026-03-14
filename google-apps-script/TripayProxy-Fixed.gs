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

  // 2. GET TRANSACTION DETAIL
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

  // 3. JIKA TIDAK ADA AKSI
  return ContentService.createTextOutput(
    'Backend Tripay Aktif. Gunakan parameter ?action=[getPaymentChannels|getTransactionDetail] atau POST untuk createTransaction'
  );
}


/**
 * Endpoint untuk CREATE TRANSACTION dan Callback dari Tripay.
 * Dipanggil saat ada request POST ke URL Web App.
 */
function doPost(e) {
  try {
    // Cek apakah ini callback dari Tripay (ada signature header)
    const signature = e.parameter.headers ? e.parameter.headers['x-signature'] : null;

    // Jika ada raw body, ini kemungkinan callback dari Tripay
    if (e.postData && e.postData.contents && signature) {
      return handleTripayCallback(e, signature);
    }

    // Jika tidak, ini adalah request create transaction dari frontend
    return handleCreateTransaction(e);

  } catch (err) {
    logToSheet(LOG_SHEET_TRANSACTIONS, {
      type: 'Error doPost',
      message: err.message,
      stack: err.stack
    });
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: 'Internal Server Error: ' + err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle Create Transaction dari Frontend
 */
function handleCreateTransaction(e) {
  try {
    // Parse JSON body dari frontend
    let requestData;

    if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
      } catch (parseError) {
        logToSheet(LOG_SHEET_TRANSACTIONS, {
          type: 'Error Parsing JSON',
          error: parseError.message,
          rawData: e.postData.contents
        });
        return ContentService.createTextOutput(
          JSON.stringify({ success: false, message: 'Invalid JSON format' })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: 'No data provided' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    logToSheet(LOG_SHEET_TRANSACTIONS, {
      type: 'Create Transaction Request',
      requestData: requestData
    });

    // Validasi data yang diterima dari frontend
    if (!requestData.amount || !requestData.method) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, message: 'Parameter amount & method wajib diisi' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const amount = parseInt(requestData.amount, 10);
    const merchantRef = requestData.merchant_ref || `MY-ORDER-${Date.now()}`;

    // Buat Signature
    const stringToSign = MERCHANT_CODE + merchantRef + amount;
    const signatureBytes = Utilities.computeHmacSha256Signature(stringToSign, PRIVATE_KEY);
    const signature = bytesToHex(signatureBytes);

    // Siapkan payload untuk Tripay API
    const payload = {
      method: requestData.method,
      merchant_ref: merchantRef,
      amount: amount,
      customer_name: requestData.customer_name || 'Pelanggan',
      customer_email: requestData.customer_email || 'pelanggan@example.com',
      customer_phone: requestData.customer_phone || '081234567890',
      order_items: requestData.order_items || [
        {
          sku: 'TRYOUT-01',
          name: 'Tryout CPNS',
          price: amount,
          quantity: 1
        }
      ],
      callback_url: requestData.callback_url || ScriptApp.getService().getUrl(),
      return_url: requestData.return_url || 'https://website-anda.com/terima-kasih',
      expired_time: requestData.expired_time || (Math.floor(Date.now() / 1000) + (24 * 60 * 60)),
      signature: signature
    };

    logToSheet(LOG_SHEET_TRANSACTIONS, {
      type: 'Tripay Request Payload',
      payload: payload
    });

    // Panggil Tripay API
    const result = callTripayAPI('/transaction/create', 'post', payload);

    logToSheet(LOG_SHEET_TRANSACTIONS, {
      type: 'Tripay Response',
      result: result
    });

    // Return response ke frontend
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logToSheet(LOG_SHEET_TRANSACTIONS, {
      type: 'Error Create Transaction',
      message: err.message,
      stack: err.stack
    });
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: 'Terjadi error internal: ' + err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle Callback dari Tripay
 */
function handleTripayCallback(e, signature) {
  try {
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
    logToSheet(LOG_SHEET_CALLBACKS, {
      type: 'Error Callback',
      message: err.message,
      stack: err.stack
    });
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: 'Internal Server Error: ' + err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
