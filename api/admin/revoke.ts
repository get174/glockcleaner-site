import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = (req.headers['x-api-key'] || '').toString();
  if (apiKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ error: 'Unauthorized' });

  const { licenseKey } = req.body || {};
  if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.length > 50) {
    return res.status(400).json({ error: 'License key required' });
  }

  try {
    const { error } = await supabase
      .from('licenses')
      .update({ status: 'revoked' })
      .eq('license_key', licenseKey);

    if (error) return res.status(500).json({ error: 'Database error' });
    return res.json({ success: true });
  } catch (err) {
    console.error('admin/revoke error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
