import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { getUserContext } from '@/lib/auth';
import { createOrganization, listOrganizations } from '@/lib/store';

export async function GET() {
  const user = getUserContext();
  return ok({ items: listOrganizations(user.userId) }, crypto.randomUUID());
}

export async function POST(request: Request) {
  const user = getUserContext();
  const body = (await request.json()) as { name?: string };
  if (!body.name || body.name.trim().length < 3) {
    return fail('Organization name must be at least 3 characters.', crypto.randomUUID(), 422);
  }
  const item = createOrganization(user.userId, body.name.trim());
  return ok({ organization: item }, crypto.randomUUID());
}
