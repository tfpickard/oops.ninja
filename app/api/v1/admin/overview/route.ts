import crypto from 'crypto';
import { ok } from '@/lib/http';
import { getAdminMetrics } from '@/lib/store';
import { getUserContext } from '@/lib/auth/server';

export async function GET() {
  const { user } = await getUserContext();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (user.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }
  return ok({ metrics: getAdminMetrics() }, crypto.randomUUID());
}
