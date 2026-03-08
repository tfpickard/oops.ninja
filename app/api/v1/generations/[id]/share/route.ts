import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { getUserContext } from '@/lib/auth';
import { createShareToken, getGenerationById } from '@/lib/store';

export async function POST(
  _request: Request,
  context: { params: { id: string } },
) {
  const user = getUserContext();
  const generation = getGenerationById(user.userId, context.params.id);
  if (!generation) return fail('Generation not found.', crypto.randomUUID(), 404);

  const share = createShareToken(user.userId, generation.id);
  return ok({
    share: {
      token: share.token,
      url: `/api/v1/shares/${share.token}`,
      expiresAt: share.expiresAt,
    },
  }, crypto.randomUUID());
}
