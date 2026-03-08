import crypto from 'crypto';
import { ok } from '@/lib/http';
import { getUserContext } from '@/lib/auth';
import { getAnalyticsSummary } from '@/lib/store';

export async function GET() {
  const user = getUserContext();
  return ok({ summary: getAnalyticsSummary(user.userId) }, crypto.randomUUID());
}
