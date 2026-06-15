import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase } from '../_utils';

type ApiRequest = VercelRequest & {
  body: {
    amount?: number | string;
    currency?: string;
    planName?: string;
  };
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

export default async function handler(req: ApiRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const { amount, currency, planName } = req.body || {};
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  const normalizedCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : 'EUR';

  if (!Number.isFinite(numericAmount) || !numericAmount || numericAmount <= 0) {
    return res.status(400).json({ error: 'Invalid amount. Expected a number greater than 0.' });
  }

  if (!normalizedCurrency) {
    return res.status(400).json({ error: 'Invalid currency. Expected a non-empty string.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount * 100), // Stripe uses cents
      currency: normalizedCurrency.toLowerCase(),
      metadata: {
        planName: typeof planName === 'string' && planName.trim() ? planName.trim() : 'GlockCleaner',
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