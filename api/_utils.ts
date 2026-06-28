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

// Stripe configuration
export const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const stripeBaseUrl = process.env.STRIPE_BASE_URL || 'http://localhost:5173';