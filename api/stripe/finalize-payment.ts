import type { VercelRequest, VercelResponse } from '@vercel/node';
import { emailTransporter, ensureLicenseForPayment } from '../_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId, userEmail } = (req.body || {}) as {
    paymentIntentId?: string;
    userEmail?: string;
  };

  console.log('[finalize-payment] request received', { paymentIntentId, userEmail: sanitizedEmail });

  if (!paymentIntentId || typeof paymentIntentId !== 'string' || paymentIntentId.trim() === '') {
    return res.status(400).json({ error: 'paymentIntentId is required' });
  }

  const sanitizedEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  if (!sanitizedEmail || !sanitizedEmail.includes('@') || sanitizedEmail.length > 254) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  try {
    const result = await ensureLicenseForPayment({
      email: sanitizedEmail,
      paymentId: paymentIntentId,
    });

    console.log('[finalize-payment] ensureLicenseForPayment result', { paymentIntentId, created: result.created, licenseKey: result.licenseKey });

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

    return res.status(200).json({ ok: true, created: result.created, licenseKey: result.licenseKey });
  } catch (error) {
    console.error('Error creating license after payment:', error);
    return res.status(500).json({ error: 'Failed to create license' });
  }
}
