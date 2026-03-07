import crypto from 'crypto';
import { ok } from '@/lib/http';
import { getUserContext } from '@/lib/auth';
import { listGenerations } from '@/lib/store';

export async function GET() {
  const user = getUserContext();
  return ok({ items: listGenerations(user.userId) }, crypto.randomUUID());
}
