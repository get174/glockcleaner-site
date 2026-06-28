import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../_utils';

// Max results per page to prevent data exposure
const MAX_PAGE_SIZE = 50;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = (req.headers['x-api-key'] || '').toString();
  if (apiKey !== process.env.ADMIN_API_KEY) return res.status(401).json({ error: 'Unauthorized' });

  // Pagination params
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  try {
    const { data, error, count } = await supabase
      .from('licenses')
      .select('id, email, status, plan_name, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: 'Database error' });
    return res.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('admin/licenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
