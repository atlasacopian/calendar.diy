import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).send(process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET');
} 