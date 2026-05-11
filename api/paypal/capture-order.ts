const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
const PAYPAL_BASE = `https://api.${PAYPAL_MODE === 'live' ? '' : 'sandbox.'}paypal.com`;
const TOKEN_URL = `${PAYPAL_BASE}/v1/oauth2/token`;
const ORDER_URL = `${PAYPAL_BASE}/v2/checkout/orders`;

type ApiResponse = {
  status: (code: number) => { json: (body: unknown) => void };
};



const errorResponse = (res: ApiResponse, message: string, status = 500) => {
  res.status(status).json({ error: message });
};


const getAccessToken = async () => {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error('PayPal server credentials sont manquantes.');
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || JSON.stringify(data));
  }

  return data.access_token;
};

type HandlerReq = {
  method?: string;
  body?: { orderID?: string };
};

type HandlerRes = ApiResponse & {
  status: (code: number) => { json: (body: unknown) => void };
};

export default async function handler(req: HandlerReq, res: HandlerRes) {

  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405);
  }

  const { orderID } = req.body || {};
  if (!orderID) {
    return errorResponse(res, 'Missing orderID.', 400);
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
      throw new Error(data.message || JSON.stringify(data));
    }

    return res.status(200).json(data);
  } catch (error: unknown) {
    console.error('PayPal capture-order error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

