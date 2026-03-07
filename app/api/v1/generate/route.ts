import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { generationRequestSchema } from '@/lib/contracts';
import { moderateScenario } from '@/lib/policy';
import { generateVariants } from '@/lib/generator';
import { createGeneration } from '@/lib/store';
import { checkRateLimit } from '@/lib/rate-limit';
import { getUserContext } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const user = getUserContext();
  const limit = checkRateLimit(`${user.userId}:generate`);
  if (!limit.allowed) return fail('Rate limit exceeded.', requestId, 429);

  const parsed = generationRequestSchema.safeParse(await request.json());
  if (!parsed.success) return fail('Invalid request payload.', requestId, 422);

  const moderation = moderateScenario(parsed.data.scenario);
  if (!moderation.allowed) return fail(moderation.reason ?? 'Policy restricted.', requestId, 403);

  const record = createGeneration(user.userId, parsed.data.scenario);
  const variants = generateVariants(parsed.data);

  return ok({ generationId: record.id, variants }, requestId);
}
