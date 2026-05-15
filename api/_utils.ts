import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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
  const bytes = cryptoRandomBytes(16);
  const hex = bytes.toString('hex').toUpperCase();
  return `GLC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

function cryptoRandomBytes(n: number) {
  // Use crypto if available, otherwise fallback to simple RNG (not ideal but workable in serverless)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    return crypto.randomBytes(n);
  } catch (e) {
    const buf = Buffer.allocUnsafe(n);
    for (let i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 256);
    return buf;
  }
}

export const paypalClientId = process.env.PAYPAL_CLIENT_ID;
export const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
export const paypalEnvironment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
export const paypalBaseUrl = paypalEnvironment === 'production' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
