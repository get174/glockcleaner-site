import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../_utils.js';

type ApiRequest = VercelRequest & {
  body: {
    amount?: number | string;
    currency?: string;
    planName?: string;
  };
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
});

// Whitelist of allowed currencies to prevent rate manipulation
const ALLOWED_CURRENCIES = new Set(['EUR', 'USD', 'GBP']);
const MAX_AMOUNT = 10000; // Max 10,000 per transaction (cents)

export default async function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { amount, currency, planName, userEmail } = req.body || {};
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  const normalizedCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : 'EUR';

  if (!Number.isFinite(numericAmount) || !numericAmount || numericAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount. Expected a number greater than 0.' });
  }

  if (!normalizedCurrency) {
    return res.status(400).json({ error: 'Invalid currency. Expected a non-empty string.' });
  }

  // SECURITY: Whitelist currency to prevent rate manipulation
  if (!ALLOWED_CURRENCIES.has(normalizedCurrency)) {
    return res.status(400).json({ error: 'Currency not supported.' });
  }

  // SECURITY: Limit maximum amount
  const amountInCents = Math.round(numericAmount * 100);
  if (amountInCents > MAX_AMOUNT * 100) {
    return res.status(400).json({ error: 'Amount exceeds maximum allowed.' });
  }

  // Sanitize planName
  const sanitizedPlanName = typeof planName === 'string' && planName.trim() ? planName.trim() : 'GlockCleaner';

  // SECURITY: Validate email for webhook
  const sanitizedEmail = typeof userEmail === 'string' ? userEmail.trim() : '';
  if (sanitizedEmail && (!sanitizedEmail.includes('@') || sanitizedEmail.length > 254)) {
    return res.status(400).json({ error: 'Invalid email.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: normalizedCurrency.toLowerCase(),
      metadata: {
        planName: sanitizedPlanName,
        userEmail: sanitizedEmail, // Required for webhook - never trust receipt_email
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe create-payment-intent error:', error);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
}