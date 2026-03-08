import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { getSharedGeneration } from '@/lib/store';

export async function GET(
  _request: Request,
  context: { params: { token: string } },
) {
  const item = getSharedGeneration(context.params.token);
  if (!item) {
    return fail('Share link is invalid or expired.', crypto.randomUUID(), 404);
  }

  return ok({
    generation: item.generation,
    variants: item.variants,
  }, crypto.randomUUID());
}
