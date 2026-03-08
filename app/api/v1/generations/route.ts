import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { getUserContext } from '@/lib/auth';
import { listGenerations } from '@/lib/store';

export async function GET(request: Request) {
  const user = getUserContext();
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? '20');
  const offset = Number(searchParams.get('offset') ?? '0');

  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    return fail('Pagination values must be numeric.', crypto.randomUUID(), 422, 'VALIDATION_ERROR');
  }

  return ok(listGenerations(user.userId, limit, offset), crypto.randomUUID());
}
