import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { createApiKey, deleteApiKey, listApiKeys } from '@/lib/store';
import { getUserContext } from '@/lib/auth';

export async function GET() {
  const user = getUserContext();
  return ok({ items: listApiKeys(user.userId) }, crypto.randomUUID());
}

export async function POST() {
  const user = getUserContext();
  return ok({ key: createApiKey(user.userId) }, crypto.randomUUID());
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { id?: string };
  if (!body.id) return fail('id required', crypto.randomUUID(), 422);
  const user = getUserContext();
  deleteApiKey(user.userId, body.id);
  return ok({ deleted: true }, crypto.randomUUID());
}
