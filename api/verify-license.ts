import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { licenseKey } = req.body || {};
  if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.length > 50) {
    return res.status(400).json({ valid: false, error: 'License key required' });
  }

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('status')
      .eq('license_key', licenseKey)
      .single();

    if (error || !data) return res.json({ valid: false });
    return res.json({ valid: data.status === 'active' });
  } catch (err) {
    console.error('verify-license error:', err);
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }
}
