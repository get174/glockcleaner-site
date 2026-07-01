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

  const sanitizedEmail = typeof userEmail === 'string' ? userEmail.trim().toLowerCase() : '';
  console.log('[finalize-payment] request received', { paymentIntentId, userEmail: sanitizedEmail });

  if (!paymentIntentId || typeof paymentIntentId !== 'string' || paymentIntentId.trim() === '') {
    return res.status(400).json({ error: 'paymentIntentId is required' });
  }
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
        const supportEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'support@getglockcleaner.com';
        await emailTransporter.sendMail({
          from: supportEmail,
          to: sanitizedEmail,
          subject: 'Votre clé d’activation GlockCleaner',
          html: `
            <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; line-height:1.4;">
              <header style="padding:16px 0; border-bottom:1px solid #e6e6e6; margin-bottom:20px;">
                <h2 style="margin:0; color:#0ea5a4;">GlockCleaner</h2>
              </header>

              <main>
                <p>Bonjour,</p>
                <p>Merci pour votre achat — votre licence GlockCleaner a été activée avec succès. Retrouvez ci‑dessous votre clé d’activation :</p>

                <div style="background:#f8fafc;padding:18px;border-radius:8px;margin:18px 0;font-family:monospace;font-size:18px;">
                  ${result.licenseKey}
                </div>

                <p>Instructions d’activation :</p>
                <ol>
                  <li>Ouvrez l’application GlockCleaner.</li>
                  <li>Allez dans <strong>Paramètres → Licence</strong>.</li>
                  <li>Collez la clé ci‑dessus et cliquez sur <em>Activer</em>.</li>
                </ol>

                <p>Si vous rencontrez le moindre problème, répondez simplement à cet e‑mail ou contactez notre support : <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>

                <p>Bonne utilisation,<br/>L’équipe GlockCleaner</p>
              </main>

              <footer style="margin-top:24px;font-size:12px;color:#6b7280;border-top:1px solid #eef2f7;padding-top:12px;">
                <div>GlockCleaner — Simplifiez le nettoyage de vos armes.</div>
              </footer>
            </div>
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
