import crypto from 'crypto';
import { ok } from '@/lib/http';
import { getUserContext } from '@/lib/auth';

export async function GET() {
  const user = getUserContext();
  return ok({ user }, crypto.randomUUID());
}
