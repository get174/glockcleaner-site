import type { VercelRequest, VercelResponse } from '@vercel/node';
import stripeWebhookHandler from './stripe/webhook.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return stripeWebhookHandler(req, res);
}
