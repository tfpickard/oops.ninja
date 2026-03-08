import crypto from 'crypto';
import { ok } from '@/lib/http';
import { getAdminMetrics } from '@/lib/store';

export async function GET() {
  return ok({ metrics: getAdminMetrics() }, crypto.randomUUID());
}
