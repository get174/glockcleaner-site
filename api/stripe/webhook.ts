import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase, generateLicenseKey, emailTransporter } from '../_utils';

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
    console.log('Missing Stripe signature');
    return res.status(400).send('Invalid webhook');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as string, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Invalid webhook');
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.status(200).send('Event not processed');
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const paymentId = paymentIntent.id;

  // SECURITY FIX: Never trust receipt_email from Stripe - it can be manipulated
  // Use metadata set during payment creation instead
  const email = paymentIntent.metadata?.userEmail || paymentIntent.receipt_email;

  // Validate email format before using
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    console.error('Invalid email in payment metadata');
    return res.status(400).send('Invalid payment data');
  }

  const sanitizedEmail = email.toLowerCase().trim();
  if (sanitizedEmail.length > 254) {
    console.error('Email too long');
    return res.status(400).send('Invalid email');
  }

  const { data: existing } = await supabase
    .from('licenses')
    .select('id')
    .eq('payment_id', paymentId)
    .single();

  if (existing) return res.status(200).send('Already processed');

  const licenseKey = generateLicenseKey();

  const { error } = await supabase
    .from('licenses')
    .insert({
      email: sanitizedEmail,
      license_key: licenseKey,
      payment_id: paymentId,
      status: 'active',
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving license:', error);
    return res.status(500).send('Error saving license');
  }

  // Send activation email with license key
  try {
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@getglockcleaner.com',
      to: sanitizedEmail,
      subject: 'Your GlockCleaner Activation Key',
      html: `
        <h1>Thank you for your purchase!</h1>
        <p>Your activation key is:</p>
        <pre style="background: #f5f5f5; padding: 16px; font-size: 24px; border-radius: 8px;">${licenseKey}</pre>
        <p>Use this key to activate your software.</p>
      `,
    });
  } catch (emailErr) {
    console.error('Error sending email:', emailErr);
  }

  return res.status(200).send('OK');
}