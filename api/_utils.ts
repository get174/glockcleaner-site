import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseServiceKey);

if (!hasSupabaseConfig) {
  console.error('Supabase config missing in serverless environment. Expected SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).');
}

export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateLicenseKey() {
  // Use cryptographically secure random bytes
  const bytes = randomBytes(16);
  const hex = bytes.toString('hex').toUpperCase();
  return `GLC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

export async function ensureLicenseForPayment({
  email,
  paymentId,
}: {
  email: string;
  paymentId: string;
}) {
  if (!hasSupabaseConfig) {
    const error = new Error('Supabase is not configured for license creation.');
    console.error('[license] missing Supabase config', { paymentId });
    throw error;
  }

  const sanitizedEmail = email.toLowerCase().trim();
  console.log('[license] ensureLicenseForPayment start', { paymentId, email: sanitizedEmail });

  if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
    console.error('[license] invalid email for license creation', { paymentId, email: sanitizedEmail });
    throw new Error('Invalid email for license creation');
  }

  const existingResponse = await fetch(`${supabaseUrl}/rest/v1/licenses?payment_id=eq.${encodeURIComponent(paymentId)}&select=id,license_key,status`, {
    method: 'GET',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
    },
  });

  const existingData = await existingResponse.json();

  if (!existingResponse.ok) {
    console.error('[license] lookup failed', { paymentId, status: existingResponse.status, body: existingData });
    throw new Error('Failed to query existing licenses.');
  }

  if (Array.isArray(existingData) && existingData.length > 0) {
    const existing = existingData[0];
    console.log('[license] existing license found', { paymentId, licenseKey: existing.license_key, status: existing.status });
    return {
      created: false,
      licenseKey: existing.license_key,
      status: existing.status,
    };
  }

  const licenseKey = generateLicenseKey();
  console.log('[license] generating new license', { paymentId, licenseKey });

  console.log('[license] inserting license row', {
    paymentId,
    email: sanitizedEmail,
    licenseKey,
    table: 'licenses',
  });

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/licenses`, {
    method: 'POST',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      email: sanitizedEmail,
      license_key: licenseKey,
      payment_id: paymentId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  const insertBody = await insertResponse.json().catch(() => null);

  if (!insertResponse.ok) {
    console.error('[license] insert failed', { paymentId, status: insertResponse.status, body: insertBody });
    throw new Error('Failed to insert license into Supabase.');
  }

  const insertedRow = Array.isArray(insertBody) ? insertBody[0] : insertBody;
  console.log('[license] insert success', { paymentId, licenseKey: insertedRow?.license_key, status: insertedRow?.status });

  return {
    created: true,
    licenseKey: insertedRow?.license_key || licenseKey,
    status: insertedRow?.status || 'active',
  };
}

// Stripe configuration
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const stripeBaseUrl = process.env.STRIPE_BASE_URL || 'http://localhost:5173';