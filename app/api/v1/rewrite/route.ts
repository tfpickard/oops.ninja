import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { rewriteRequestSchema } from '@/lib/contracts';
import { rewriteText } from '@/lib/generator';
import { moderateScenario } from '@/lib/policy';
import { getUserContext } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const user = getUserContext();
  const limit = checkRateLimit(`${user.userId}:rewrite`);
  if (!limit.allowed) return fail('Rate limit exceeded.', requestId, 429);

  const parsed = rewriteRequestSchema.safeParse(await request.json());
  if (!parsed.success) return fail('Invalid request payload.', requestId, 422);

  const moderation = moderateScenario(parsed.data.text);
  if (!moderation.allowed) return fail(moderation.reason ?? 'Policy restricted.', requestId, 403);

  return ok({ output: rewriteText(parsed.data.text, parsed.data.transform) }, requestId);
}
