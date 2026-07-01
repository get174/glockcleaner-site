import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { emailTransporter, ensureLicenseForPayment } from '../_utils.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
});

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    req.on('data', (chunk: Uint8Array | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.log('Missing Stripe signature or webhook secret');
    return res.status(400).send('Invalid webhook');
  }

  const payload = await getRawBody(req);
  console.log('[stripe-webhook] payload length', payload.length, 'content-type', req.headers['content-type']);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Invalid webhook');
  }

  console.log('[stripe-webhook] received event', { type: event.type, id: event.id });

  if (!['payment_intent.succeeded', 'checkout.session.completed', 'charge.succeeded'].includes(event.type)) {
    return res.status(200).send('Event not processed');
  }

  let paymentId = '';
  let email = '';

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    paymentId = typeof checkoutSession.payment_intent === 'string'
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id || '';
    email = checkoutSession.customer_details?.email || checkoutSession.metadata?.userEmail || '';
  } else if (event.type === 'charge.succeeded') {
    const charge = event.data.object as Stripe.Charge;
    paymentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : '';
    email = charge.billing_details?.email || '';
  } else {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    paymentId = paymentIntent.id;
    email = paymentIntent.metadata?.userEmail || paymentIntent.receipt_email || '';
  }

  if (!paymentId) {
    console.error('[stripe-webhook] missing payment id', { eventType: event.type });
    return res.status(400).send('Invalid payment data');
  }

  const sanitizedEmail = email.toLowerCase().trim();
  console.log('[stripe-webhook] processing payment', { eventType: event.type, paymentId, email: sanitizedEmail });

  if (!sanitizedEmail || sanitizedEmail.length > 254 || !sanitizedEmail.includes('@')) {
    console.error('Invalid email in payment metadata');
    return res.status(400).send('Invalid payment data');
  }

  try {
    const result = await ensureLicenseForPayment({
      email: sanitizedEmail,
      paymentId,
    });

    if (result.created) {
      try {
        await emailTransporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@getglockcleaner.com',
          to: sanitizedEmail,
          subject: 'Your GlockCleaner Activation Key',
          html: `
            <h1>Thank you for your purchase!</h1>
            <p>Your activation key is:</p>
            <pre style="background: #f5f5f5; padding: 16px; font-size: 24px; border-radius: 8px;">${result.licenseKey}</pre>
            <p>Use this key to activate your software.</p>
          `,
        });
      } catch (emailErr) {
        console.error('Error sending email:', emailErr);
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error saving license:', error);
    return res.status(500).send('Error saving license');
  }
}