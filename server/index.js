import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
const PAYPAL_SERVER_PORT = Number(process.env.PAYPAL_SERVER_PORT || 4000);

const PAYPAL_BASE = `https://api.${PAYPAL_MODE === 'live' ? '' : 'sandbox.'}paypal.com`;
const TOKEN_URL = `${PAYPAL_BASE}/v1/oauth2/token`;
const ORDER_URL = `${PAYPAL_BASE}/v2/checkout/orders`;

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.warn('PayPal server: PAYPAL_CLIENT_ID or PAYPAL_SECRET is not configured.');
}

async function getAccessToken() {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || JSON.stringify(data));
  }

  return data.access_token;
}

app.post('/api/paypal/create-order', async (req, res) => {
  const { amount, currency, planName } = req.body;

  if (!amount || !currency) {
    return res.status(400).json({ error: 'Missing amount or currency.' });
  }

  try {
    const accessToken = await getAccessToken();
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            value: Number(amount).toFixed(2),
            currency_code: currency,
          },
          description: planName || 'Achat GlockCleaner',
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
      },
    };

    console.log('Creating PayPal order with payload:', JSON.stringify(orderPayload, null, 2));

    const response = await fetch(ORDER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();
    console.log('PayPal create-order response:', data);

    if (!response.ok) {
      console.error('PayPal error:', data);
      throw new Error(data.message || JSON.stringify(data));
    }

    return res.json({ orderID: data.id });
  } catch (error) {
    console.error('PayPal create-order error:', error);
    return res.status(500).json({ error: String(error) });
  }
});

app.post('/api/paypal/capture-order', async (req, res) => {
  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ error: 'Missing orderID.' });
  }

  try {
    console.log('Capturing PayPal order:', orderID);

    const accessToken = await getAccessToken();
    const response = await fetch(`${ORDER_URL}/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('PayPal capture response:', data);

    if (!response.ok) {
      console.error('PayPal capture error:', data);
      throw new Error(data.message || JSON.stringify(data));
    }

    return res.json(data);
  } catch (error) {
    console.error('PayPal capture-order error:', error);
    return res.status(500).json({ error: String(error) });
  }
});

app.listen(PAYPAL_SERVER_PORT, () => {
  console.log(`PayPal server listening on http://localhost:${PAYPAL_SERVER_PORT}`);
});
