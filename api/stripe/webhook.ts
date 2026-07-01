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

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const requestBody = Buffer.concat(chunks).toString('utf8');

  console.log('[stripe-webhook] payload length', requestBody.length, 'content-type', req.headers['content-type']);

  let event: Stripe.Event;

  console.log('SIGNATURE HEADER:', sig);
  console.log('SECRET EXISTS:', !!webhookSecret);
  console.log('BODY LENGTH:', requestBody.length);

  try {
    event = stripe.webhooks.constructEvent(requestBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Invalid webhook');
  }

  console.log('[stripe-webhook] received event', { type: event.type, id: event.id });

  if (event.type !== 'checkout.session.completed') {
    console.log('[stripe-webhook] ignoring event type', { type: event.type, id: event.id });
    return res.status(200).send('Ignored');
  }

  let paymentId = '';
  let email = '';
  let checkoutSession: Stripe.Checkout.Session | null = null;

  if (event.type === 'checkout.session.completed') {
    checkoutSession = event.data.object as Stripe.Checkout.Session;
    paymentId = typeof checkoutSession.payment_intent === 'string'
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id || checkoutSession.id;
    email = checkoutSession.customer_details?.email || checkoutSession.customer_email || checkoutSession.metadata?.userEmail || '';
  }

  console.log('[stripe-webhook] extracted checkout data', {
    eventType: event.type,
    paymentId,
    email,
    checkoutId: checkoutSession?.id,
  });

  if (!paymentId) {
    console.error('[stripe-webhook] missing payment id', { eventType: event.type });
    return res.status(400).send('Invalid payment data');
  }

  if (!email) {
    console.error('[stripe-webhook] missing email', { eventType: event.type, paymentId });
    return res.status(400).send('Missing email');
  }

  const sanitizedEmail = email.toLowerCase().trim();
  console.log('[stripe-webhook] processing payment', { eventType: event.type, paymentId, email: sanitizedEmail });

  if (!sanitizedEmail || sanitizedEmail.length > 254 || !sanitizedEmail.includes('@')) {
    console.error('Invalid email in payment metadata');
    return res.status(400).send('Invalid payment data');
  }

  console.log('[stripe-webhook] calling ensureLicenseForPayment', {
    eventType: event.type,
    paymentId,
    email: sanitizedEmail,
  });

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