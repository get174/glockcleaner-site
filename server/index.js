import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import axios from 'axios';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ Stripe key missing! Set STRIPE_SECRET_KEY in .env');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
});

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase config missing! Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration PayPal
const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
const paypalEnvironment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const paypalBaseUrl = paypalEnvironment === 'production'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

// Configuration email
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Générateur de licence sécurisé
function generateLicenseKey() {
  const bytes = crypto.randomBytes(16);
  const hex = bytes.toString('hex').toUpperCase();
  return `GLC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}

// Middleware de sécurité
const app = express();
// Parse allowed origins (comma-separated in env)
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim())
  : false;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(helmet());

// NOTE: express.json() is needed for all routes except Stripe webhook
// Stripe webhook uses express.raw() as route-specific middleware

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Conditional body parsing: skip for Stripe webhook
const jsonParser = express.json({ limit: '10mb' });
app.use((req, res, next) => {
  if (req.path === '/api/stripe/webhook' || req.originalUrl.startsWith('/api/stripe/webhook')) {
    // Skip JSON parsing for Stripe webhook
    return next();
  }
  return jsonParser(req, res, next);
});

// Route de vérification de licence
app.post('/api/verify-license', async (req, res) => {
  const { licenseKey } = req.body;

  if (!licenseKey) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('status')
      .eq('license_key', licenseKey)
      .single();

    if (error || !data) {
      return res.json({ valid: false });
    }

    res.json({ valid: data.status === 'active' });
  } catch (err) {
    console.error('Error verifying license:', err);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

// Webhook PayPal
app.post('/api/webhook/paypal', async (req, res) => {
  const headers = req.headers;
  const body = req.body;

  // Vérifier la signature PayPal
  const transmissionId = headers['paypal-transmission-id'];
  const transmissionTime = headers['paypal-transmission-time'];
  const transmissionSig = headers['paypal-transmission-sig'];
  const certUrl = headers['paypal-cert-url'];
  const authAlgo = headers['paypal-auth-algo'];

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    console.log('Missing PayPal headers');
    return res.status(400).send('Invalid webhook');
  }

  try {
    // Vérifier la signature PayPal via API
    const verifyPayload = {
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: body
    };

    const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');
    const verifyResponse = await axios.post(`${paypalBaseUrl}/v1/notifications/verify-webhook-signature`, verifyPayload, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (verifyResponse.data.verification_status !== 'SUCCESS') {
      console.log('Webhook verification failed:', verifyResponse.data);
      return res.status(400).send('Invalid webhook');
    }

    // Traiter seulement PAYMENT.CAPTURE.COMPLETED
    if (body.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return res.status(200).send('Event not processed');
    }

    const paymentId = body.resource.id;
    const email = body.resource.payer.email_address;

    // Vérifier si déjà traité
    const { data: existing } = await supabase
      .from('licenses')
      .select('id')
      .eq('payment_id', paymentId)
      .single();

    if (existing) {
      return res.status(200).send('Already processed');
    }

    // Générer licence
    const licenseKey = generateLicenseKey();

    // Sauvegarder en DB
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

    // Envoyer email
    try {
      const supportEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'support@getglockcleaner.com';
      await emailTransporter.sendMail({
        from: supportEmail,
        to: email,
        subject: 'Votre clé d’activation GlockCleaner',
        text: `Bonjour,\n\nMerci pour votre achat. Votre clé d'activation : ${licenseKey}\n\nSi vous avez besoin d'aide : ${supportEmail}`,
        html: `
          <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#111827; line-height:1.4;">
            <h2 style="color:#0ea5a4;margin:0 0 12px 0;">GlockCleaner</h2>
            <p>Bonjour,</p>
            <p>Merci pour votre achat — votre licence GlockCleaner a été activée. Voici votre clé d’activation :</p>
            <div style="background:#f8fafc;padding:16px;border-radius:8px;font-family:monospace;font-size:18px;margin:12px 0;">${licenseKey}</div>
            <p>Si vous avez besoin d’aide, contactez : <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>Bien cordialement,<br/>L’équipe GlockCleaner</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Internal server error');
  }
});

// Endpoint admin pour voir les licences (protégé par clé API)
app.get('/api/admin/licenses', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint admin pour révoquer une licence
app.post('/api/admin/revoke', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { licenseKey } = req.body;
  if (!licenseKey) {
    return res.status(400).json({ error: 'License key required' });
  }

  try {
    const { error } = await supabase
      .from('licenses')
      .update({ status: 'revoked' })
      .eq('license_key', licenseKey);

    if (error) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stripe create-payment-intent
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  const { amount, currency, planName } = req.body || {};
  console.log('[create-payment-intent] Received:', { amount, currency, planName });
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  const normalizedCurrency = typeof currency === 'string' ? currency.trim().toUpperCase() : 'EUR';

  if (!Number.isFinite(numericAmount) || !numericAmount || numericAmount <= 0) {
    console.log('[create-payment-intent] Invalid amount:', numericAmount);
    return res.status(400).json({ error: 'Invalid amount. Expected a number greater than 0.' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount * 100),
      currency: normalizedCurrency.toLowerCase(),
      metadata: {
        planName: typeof planName === 'string' && planName.trim() ? planName.trim() : 'GlockCleaner',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('[create-payment-intent] Success, clientSecret:', paymentIntent.client_secret?.slice(0, 20) + '...');
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe create-payment-intent error:', error);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Stripe webhook (simplified version)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.log('Missing Stripe signature');
    return res.status(400).send('Invalid webhook');
  }

  let event;
  try {
    const rawBody = req.body;
    const bodyBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : typeof rawBody === 'string'
      ? Buffer.from(rawBody, 'utf-8')
      : null;

    console.log('[stripe-webhook] payload length', bodyBuffer ? bodyBuffer.length : 0, 'content-type', req.headers['content-type']);

    if (!bodyBuffer) {
      console.error('Stripe webhook raw body is missing or not a buffer', { type: typeof rawBody });
      return res.status(400).send('Invalid webhook');
    }

    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Invalid webhook');
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.status(200).send('Event not processed');
  }

  const paymentIntent = event.data.object;
  const paymentId = paymentIntent.id;
  const email = paymentIntent.metadata?.userEmail || paymentIntent.receipt_email;

  if (!email) {
    console.error('No email found in payment intent');
    return res.status(400).send('No email provided');
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

  // Envoyer email
  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Votre licence GlockCleaner',
      text: `Votre licence : ${licenseKey}`,
      html: `<p>Votre licence : <strong>${licenseKey}</strong></p>`,
    });
  } catch (emailErr) {
    console.error('Error sending email:', emailErr);
  }

  return res.status(200).send('OK');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});