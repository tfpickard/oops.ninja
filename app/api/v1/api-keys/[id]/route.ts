import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { deleteApiKey } from '@/lib/store';
import { getUserContext } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
) {
  const user = getUserContext();
  const deleted = deleteApiKey(user.userId, context.params.id);
  if (!deleted) {
    return fail('API key not found.', crypto.randomUUID(), 404, 'NOT_FOUND');
  }

  return ok({ deleted: true }, crypto.randomUUID());
}
