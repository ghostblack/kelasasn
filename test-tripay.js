const crypto = require('crypto');
const axios = require('axios'); // We can use fetch or axios

const apiKey = 'DEV-pnxETy9k3YyvbbzJ6heBhEp6dLuZqQT0yHARLTAy';
const merchantCode = 'T46118';
const merchantRef = 'TEST-' + Date.now();
const amount = 100000;

const keys = [
  'O9Kcz-WsrHJ-CcRWU-loP7N-Xght0',
  '09Kcz-WsrHJ-CcRWU-loP7N-Xght0',
  'O9Kcz-WsrHJ-CcRWU-IoP7N-Xght0',
  '09Kcz-WsrHJ-CcRWU-IoP7N-Xght0',
  'O9Kcz-WsrHJ-CcRWU-loP7N-XghtO',
  '09Kcz-WsrHJ-CcRWU-loP7N-XghtO'
];

async function testKeys() {
  for (let key of keys) {
    const signature = crypto.createHmac('sha256', key)
      .update(merchantCode + merchantRef + amount)
      .digest('hex');
    
    try {
      const res = await fetch('https://tripay.co.id/api-sandbox/transaction/create', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'BRIVA',
          merchant_ref: merchantRef,
          amount: amount,
          customer_name: 'Test',
          customer_email: 'test@example.com',
          customer_phone: '081234567890',
          order_items: [{name:'Test', price:amount, quantity:1}],
          signature: signature
        })
      });
      const data = await res.json();
      console.log(`Key ${key}: ${data.success ? 'SUCCESS' : data.message}`);
    } catch(e) {
      console.log(`Key ${key}: ERROR`);
    }
  }
}
testKeys();
