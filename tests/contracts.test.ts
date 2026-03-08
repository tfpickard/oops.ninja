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
      llm: { provider: 'openai', model: 'gpt-5.2', reasoningEffort: 'none', verbosity: 'medium' },
    });

    expect(parsed.audience).toBe('Minecraft speedrunning guild moderators');
    expect(parsed.medium).toBe('Skywriting over HQ');
  });

  it('rejects GPT-5-only controls for non GPT-5 OpenAI configurations', () => {
    expect(() =>
      generationRequestSchema.parse({
        scenario: 'I missed a customer sync and need to recover trust with a better follow-up.',
        mode: generationModes[0],
        tone: toneOptions[0],
        formality: formalityOptions[0],
        accountabilityPosture: accountabilityPostureOptions[0],
        audience: 'customer',
        medium: 'email',
        obnoxiousness: 40,
        sycophancy: 20,
        llm: { provider: 'openai', model: 'gpt-4.1-mini', reasoningEffort: 'high' },
      }),
    ).toThrow('Reasoning effort is only supported for OpenAI GPT-5 family models.');
  });
});
