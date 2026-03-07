import crypto from 'crypto';
import { ok } from '@/lib/http';

export async function GET() {
  const requestId = crypto.randomUUID();
  return ok({ templates: ['Incident summary', 'Ownership-forward response', 'Corporate PR statement'] }, requestId);
}
