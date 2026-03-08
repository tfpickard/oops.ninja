import crypto from 'crypto';
import { ok } from '@/lib/http';
import { createApiKey, listApiKeys } from '@/lib/store';
import { getUserContext } from '@/lib/auth';

export async function GET() {
  const user = getUserContext();
  return ok({ items: listApiKeys(user.userId) }, crypto.randomUUID());
}

export async function POST() {
  const user = getUserContext();
  return ok({ key: createApiKey(user.userId) }, crypto.randomUUID(), 201);
}
