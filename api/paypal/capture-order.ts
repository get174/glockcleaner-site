type ApiRequest = {
  method?: string;
  body?: {
    orderID?: string;
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

  const rawOrderID = req.body?.orderID;
  const orderID = typeof rawOrderID === 'string' ? rawOrderID.trim() : '';
  if (!orderID) {
    return errorResponse(res, 'Invalid orderID. Expected a non-empty string.', 400);
  }

  try {
    const accessToken = await getAccessToken();
    const response = await fetch(`${ORDER_URL}/${orderID}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      const error = new Error((data as { message?: string }).message || JSON.stringify(data)) as PaypalError;
      error.details = data;
      error.paypalDebugId = response.headers.get('paypal-debug-id');
      throw error;
    }

    return res.status(200).json(data);
  } catch (rawError: unknown) {
    const error = rawError as PaypalError;
    const normalizedMessage =
      error?.message?.replace(/^Error:\s*/, '') || 'Unknown error while capturing PayPal order.';
    const details = error?.details ?? null;
    const paypalDebugId = error?.paypalDebugId ?? null;
    console.error('PayPal capture-order error:', { message: normalizedMessage, details, paypalDebugId });
    return errorResponse(res, normalizedMessage, 500, details, paypalDebugId);
  }
}
