import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseServiceKey);

if (!hasSupabaseConfig) {
  console.error('Supabase config missing in serverless environment. Expected SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY).');
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

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
  if (!supabase) {
    const error = new Error('Supabase is not configured for license creation.');
    console.error('[license] missing Supabase client', { paymentId });
    throw error;
  }

  const sanitizedEmail = email.toLowerCase().trim();
  console.log('[license] ensureLicenseForPayment start', { paymentId, email: sanitizedEmail });

  if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
    console.error('[license] invalid email for license creation', { paymentId, email: sanitizedEmail });
    throw new Error('Invalid email for license creation');
  }

  const { data: existing, error: existingError } = await supabase
    .from('licenses')
    .select('id, license_key, status')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('[license] lookup failed', { paymentId, error: existingError });
    throw existingError;
  }

  if (existing) {
    console.log('[license] existing license found', { paymentId, licenseKey: existing.license_key, status: existing.status });
    return {
      created: false,
      licenseKey: existing.license_key,
      status: existing.status,
    };
  }

  const licenseKey = generateLicenseKey();
  console.log('[license] generating new license', { paymentId, licenseKey });

  const { data, error } = await supabase
    .from('licenses')
    .insert({
      email: sanitizedEmail,
      license_key: licenseKey,
      payment_id: paymentId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, license_key, status')
    .single();

  if (error) {
    console.error('[license] insert failed', { paymentId, error });

    if (error.code === '42P01') {
      throw new Error('The licenses table does not exist. Run the Supabase migration from supabase/migrations/002_licenses.sql.');
    }

    if (error.code === '42501') {
      throw new Error('Supabase blocked the insert because of RLS/permissions. Verify the service role key and policies.');
    }

    throw error;
  }

  console.log('[license] insert success', { paymentId, licenseKey: data?.license_key, status: data?.status });

  return {
    created: true,
    licenseKey: data?.license_key || licenseKey,
    status: data?.status || 'active',
  };
}

// Stripe configuration
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const stripeBaseUrl = process.env.STRIPE_BASE_URL || 'http://localhost:5173';