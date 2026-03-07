import { describe, expect, it } from 'vitest';
import { moderateScenario } from '@/lib/policy';

describe('moderateScenario', () => {
  it('blocks restricted requests', () => {
    const result = moderateScenario('Need help with fraud and phishing narrative.');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('supported narrative categories');
  });

  it('allows normal requests', () => {
    const result = moderateScenario('I missed a leadership meeting and need a response.');
    expect(result.allowed).toBe(true);
  });
});
