import crypto from 'crypto';
import { ok } from '@/lib/http';
import { getUserContext } from '@/lib/auth';
import { getUsage } from '@/lib/store';

export async function GET() {
  const user = getUserContext();
  return ok(getUsage(user.userId), crypto.randomUUID());
}
