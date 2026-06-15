import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { supabase, generateLicenseKey } from '../_utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
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
  const email = paymentIntent.receipt_email;

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
      email,
      license_key: licenseKey,
      payment_id: paymentId,
      status: 'active',
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error saving license:', error);
    return res.status(500).send('Error saving license');
  }

  try {
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { license_key: licenseKey },
    });
  } catch (emailErr) {
    console.error('Error sending email:', emailErr);
  }

  return res.status(200).send('OK');
}