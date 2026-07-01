import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase config missing in serverless environment.');
}

export const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

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
  const sanitizedEmail = email.toLowerCase().trim();

  if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
    throw new Error('Invalid email for license creation');
  }

  const { data: existing, error: existingError } = await supabase
    .from('licenses')
    .select('id, license_key, status')
    .eq('payment_id', paymentId)
    .maybeSingle();

  if (existingError && existingError.code !== 'PGRST116') {
    throw existingError;
  }

  if (existing) {
    return {
      created: false,
      licenseKey: existing.license_key,
      status: existing.status,
    };
  }

  const licenseKey = generateLicenseKey();
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
    throw error;
  }

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