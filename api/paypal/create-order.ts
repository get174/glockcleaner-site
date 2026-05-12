type ApiRequest = {
  method?: string;
  body?: {
    amount?: number | string;
    currency?: string;
    planName?: string;
  };
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
};

type PaypalError = Error & {
  details?: unknown;
  paypalDebugId?: string | null;
};

type PaypalTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type PaypalOrderResponse = {
  id?: string;
  message?: string;
};

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
const PAYPAL_BASE = `https://api.${PAYPAL_MODE === 'live' ? '' : 'sandbox.'}paypal.com`;
const TOKEN_URL = `${PAYPAL_BASE}/v1/oauth2/token`;
const ORDER_URL = `${PAYPAL_BASE}/v2/checkout/orders`;

const errorResponse = (
  res: ApiResponse,
  message: string,
  status = 500,
  details: unknown = null,
  paypalDebugId: string | null = null
) => {
  res.status(status).json({ error: message, details, paypalDebugId });
};

const getAccessToken = async () => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error('PayPal server credentials are missing.');
  }

  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = (await response.json()) as PaypalTokenResponse;
  if (!response.ok) {
    const error = new Error(data.error_description || data.error || JSON.stringify(data)) as PaypalError;
    error.details = data;
    error.paypalDebugId = response.headers.get('paypal-debug-id');
    throw error;
  }

  if (!data.access_token) {
    const error = new Error('PayPal token missing in response.') as PaypalError;
    error.details = data;
    throw error;
  }

  return data.access_token;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405);
  }

  const { amount, currency, planName } = req.body || {};
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  const normalizedCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : '';

  if (!Number.isFinite(numericAmount) || !numericAmount || numericAmount <= 0) {
    return errorResponse(res, 'Invalid amount. Expected a number greater than 0.', 400);
  }

  if (!normalizedCurrency) {
    return errorResponse(res, 'Invalid currency. Expected a non-empty string.', 400);
  }

  try {
    const accessToken = await getAccessToken();
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            value: numericAmount.toFixed(2),
            currency_code: normalizedCurrency,
          },
          description: typeof planName === 'string' && planName.trim() ? planName.trim() : 'Achat GlockCleaner',
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
      },
    };

    const response = await fetch(ORDER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const data = (await response.json()) as PaypalOrderResponse;
    if (!response.ok) {
      const error = new Error(data.message || JSON.stringify(data)) as PaypalError;
      error.details = data;
      error.paypalDebugId = response.headers.get('paypal-debug-id');
      throw error;
    }

    if (!data.id) {
      const error = new Error('PayPal order id missing in response.') as PaypalError;
      error.details = data;
      throw error;
    }

    return res.status(200).json({ orderID: data.id });
  } catch (rawError: unknown) {
    const error = rawError as PaypalError;
    const normalizedMessage =
      error?.message?.replace(/^Error:\s*/, '') || 'Unknown error while creating PayPal order.';
    const details = error?.details ?? null;
    const paypalDebugId = error?.paypalDebugId ?? null;
    console.error('PayPal create-order error:', { message: normalizedMessage, details, paypalDebugId });
    return errorResponse(res, normalizedMessage, 500, details, paypalDebugId);
  }
}
