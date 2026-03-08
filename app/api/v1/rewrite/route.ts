import crypto from 'crypto';
import { fail, ok } from '@/lib/http';
import { rewriteRequestSchema } from '@/lib/contracts';
import { rewriteWithLlm } from '@/lib/llm';
import { moderateScenario } from '@/lib/policy';
import { getUserContext } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { trackModerationEvent } from '@/lib/store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const user = getUserContext();
  const limit = checkRateLimit(`${user.userId}:rewrite`);
  if (!limit.allowed) return fail('Rate limit exceeded.', requestId, 429, 'RATE_LIMITED');

  const parsed = rewriteRequestSchema.safeParse(await request.json());
  if (!parsed.success) return fail('Invalid request payload.', requestId, 422, 'VALIDATION_ERROR');

  const moderation = moderateScenario(parsed.data.text);
  if (!moderation.allowed) {
    trackModerationEvent(user.userId, moderation.reason ?? 'Policy restricted.');
    return fail(moderation.reason ?? 'Policy restricted.', requestId, 403, 'POLICY_RESTRICTED');
  }

  try {
    return ok({ output: await rewriteWithLlm(parsed.data.text, parsed.data.transform, parsed.data.llm) }, requestId);
  } catch (err) {
    console.error('LLM provider error during rewrite', { requestId, error: err });
    return fail('LLM provider failed to process the rewrite request. Please try again.', requestId, 502, 'LLM_PROVIDER_ERROR');
  }
}
