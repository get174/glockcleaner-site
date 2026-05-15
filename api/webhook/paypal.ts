import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, emailTransporter, generateLicenseKey, paypalBaseUrl, paypalClientId, paypalClientSecret } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const headers = req.headers as Record<string, any>;
  const body = req.body;

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
    const verifyPayload = {
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    };

    const auth = Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64');
    const verifyResp = await fetch(`${paypalBaseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyPayload),
    });

    const verifyData = await verifyResp.json();
    if (verifyData.verification_status !== 'SUCCESS') {
      console.log('Webhook verification failed:', verifyData);
      return res.status(400).send('Invalid webhook');
    }

    if (body.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return res.status(200).send('Event not processed');
    }

    const paymentId = body.resource.id;
    const email = body.resource.payer?.email_address;

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
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).send('Internal server error');
  }
}
