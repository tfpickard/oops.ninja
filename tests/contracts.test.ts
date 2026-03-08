import { describe, expect, it } from 'vitest';
import {
  accountabilityPostureOptions,
  audienceOptions,
  formalityOptions,
  generationModes,
  generationRequestSchema,
  mediumOptions,
  toneOptions,
} from '@/lib/contracts';

describe('contracts', () => {
  it('exposes rich dropdown catalogs for steerable controls', () => {
    expect(generationModes.length).toBeGreaterThanOrEqual(12);
    expect(toneOptions.length).toBeGreaterThanOrEqual(12);
    expect(formalityOptions.length).toBeGreaterThanOrEqual(12);
    expect(accountabilityPostureOptions.length).toBeGreaterThanOrEqual(12);
    expect(audienceOptions.length).toBeGreaterThanOrEqual(12);
    expect(mediumOptions.length).toBeGreaterThanOrEqual(12);
  });

  it('supports custom audience and medium values in generation requests', () => {
    const parsed = generationRequestSchema.parse({
      scenario: 'I missed a customer sync and need to recover trust with a better follow-up.',
      mode: generationModes[0],
      tone: toneOptions[0],
      formality: formalityOptions[0],
      accountabilityPosture: accountabilityPostureOptions[0],
      audience: 'Minecraft speedrunning guild moderators',
      medium: 'Skywriting over HQ',
      obnoxiousness: 97,
      sycophancy: 88,
      llm: { provider: 'openai', model: 'gpt-5.3' },
    });

    expect(parsed.audience).toBe('Minecraft speedrunning guild moderators');
    expect(parsed.medium).toBe('Skywriting over HQ');
  });
});
