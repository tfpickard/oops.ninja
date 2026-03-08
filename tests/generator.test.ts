import { describe, expect, it } from 'vitest';
import { generateVariants, rewriteText } from '@/lib/generator';

describe('generator', () => {
  it('returns six variants', () => {
    const variants = generateVariants({
      scenario: 'I deployed a broken release to production.',
      mode: 'Technical explanation',
      tone: 'professional',
      formality: 'executive',
      accountabilityPosture: 'calibrated ownership',
      audience: 'customer',
      medium: 'email',
      llm: { provider: 'openai', model: 'gpt-4.1-mini', apiKey: 'test-api-key-12345' },
    });

    expect(variants).toHaveLength(6);
  });

  it('rewrites text with transform prefix', () => {
    expect(rewriteText(' a  b ', 'Make this more concise')).toBe('Make this more concise: a b');
  });
});
