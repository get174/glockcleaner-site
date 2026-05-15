import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = (req.headers['x-api-key'] || '').toString();
  if (apiKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Database error' });
    return res.json(data);
  } catch (err) {
    console.error('admin/licenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
