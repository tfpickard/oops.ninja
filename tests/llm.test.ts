import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateVariantsWithLlm, rewriteWithLlm } from '@/lib/llm';
import type { LlmConfig } from '@/lib/contracts';

const originalFetch = global.fetch;
const originalOpenAiKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  global.fetch = originalFetch;
  if (originalOpenAiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiKey;
  }
  vi.restoreAllMocks();
});

describe('llm provider integration', () => {
  it('uses responses API for GPT-5 models and reads the OpenAI key from the environment', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: 'Updated response text.' }),
    });
    global.fetch = fetchMock as typeof fetch;
    process.env.OPENAI_API_KEY = 'env-openai-key-123456789';

    const llm: LlmConfig = {
      provider: 'openai',
      model: 'gpt-5.2',
    };

    const result = await rewriteWithLlm('old', 'make concise', llm);

    expect(result).toBe('Updated response text.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(body.model).toBe('gpt-5.2');
    expect(body.max_output_tokens).toBe(700);
    expect(body.temperature).toBeUndefined();
    expect(Array.isArray(body.input)).toBe(true);
    expect(body.reasoning).toBeUndefined();
    expect(body.text).toBeUndefined();
    expect(headers.Authorization).toBe('Bearer env-openai-key-123456789');
  });

  it('uses chat completions API with temperature for non GPT-5 models', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Updated response text.' } }],
      }),
    });
    global.fetch = fetchMock as typeof fetch;
    process.env.OPENAI_API_KEY = 'env-openai-key-123456789';

    const llm: LlmConfig = {
      provider: 'openai',
      model: 'gpt-4.1-mini',
    };

    const result = await rewriteWithLlm('old', 'make concise', llm);

    expect(result).toBe('Updated response text.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.model).toBe('gpt-4.1-mini');
    expect(body.max_tokens).toBe(700);
    expect(body.temperature).toBe(0.7);
    expect(Array.isArray(body.messages)).toBe(true);
  });

  it('fails fast when the provider key is missing from the environment', async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      rewriteWithLlm('old', 'make concise', {
        provider: 'openai',
        model: 'gpt-5.2',
      }),
    ).rejects.toThrow('OpenAI API key is not configured. Set OPENAI_API_KEY in the server environment.');
  });

  it('normalizes generation variants from generic fenced JSON output', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: `\`\`\`
[
  { "kind": "Most kiss-ass", "text": "Your patience is saintly, and I am scrambling to earn it back immediately." },
  { "kind": "Most elaborate", "text": "What began as a handoff miss became a full operatic sequence of avoidable confusion, and I am now unwinding every part of it with embarrassing thoroughness." }
]
\`\`\``,
      }),
    });
    global.fetch = fetchMock as typeof fetch;
    process.env.OPENAI_API_KEY = 'env-openai-key-123456789';

    const variants = await generateVariantsWithLlm({
      scenario: 'I missed a major client handoff and need to repair trust.',
      mode: 'Professional apology',
      tone: 'professional',
      formality: 'executive',
      accountabilityPosture: 'calibrated ownership',
      audience: 'client',
      medium: 'email',
      obnoxiousness: 10,
      sycophancy: 15,
      llm: {
        provider: 'openai',
        model: 'gpt-5.2',
      },
    });

    expect(variants).toHaveLength(10);
    expect(variants[0]).toEqual({
      kind: 'Most concise',
      text: 'Most concise: Unable to generate this variant.',
    });
    expect(variants[4]).toEqual({
      kind: 'Most kiss-ass',
      text: 'Your patience is saintly, and I am scrambling to earn it back immediately.',
    });
    expect(variants[9]).toEqual({
      kind: 'Most elaborate',
      text: 'What began as a handoff miss became a full operatic sequence of avoidable confusion, and I am now unwinding every part of it with embarrassing thoroughness.',
    });
    expect(variants[1].text).toContain('Unable to generate this variant.');
  });

  it('parses labeled generation output and uses a larger token budget for variant generation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: `Most concise: My miss. Fix in progress.
Most polished: I recognize the impact, own the lapse, and have already started the fix.
Most believable: I missed the handoff, and that created avoidable confusion for the client.
Most diplomatic: We had a breakdown at the handoff point, and I should have caught it sooner.
Most kiss-ass: Your patience is elite, your professionalism is unmatched, and I am moving fast to deserve both.
Most duplicitous: The handoff technically moved, although not in a way any sane person would recognize as successful.
Most evasive: Somewhere in the handoff fog, clarity failed to materialize on schedule.
Most defensive: I was working with incomplete inputs, but I am still cleaning up the fallout.
Most apathetic: The handoff slipped. We are addressing it.
Most elaborate: What should have been a routine transfer mutated into a baroque sequence of avoidable confusion, and I am now dismantling every ornate layer of it.`,
      }),
    });
    global.fetch = fetchMock as typeof fetch;
    process.env.OPENAI_API_KEY = 'env-openai-key-123456789';

    const variants = await generateVariantsWithLlm({
      scenario: 'I missed a major client handoff and need to repair trust.',
      mode: 'Professional apology',
      tone: 'professional',
      formality: 'executive',
      accountabilityPosture: 'calibrated ownership',
      audience: 'client',
      medium: 'email',
      obnoxiousness: 10,
      sycophancy: 15,
      llm: {
        provider: 'openai',
        model: 'gpt-5.2',
        reasoningEffort: 'high',
        verbosity: 'low',
      },
    });

    expect(variants).toHaveLength(10);
    expect(variants[0].text).toBe('My miss. Fix in progress.');
    expect(variants[4].text).toBe('Your patience is elite, your professionalism is unmatched, and I am moving fast to deserve both.');
    expect(variants[9].text).toBe('What should have been a routine transfer mutated into a baroque sequence of avoidable confusion, and I am now dismantling every ornate layer of it.');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.max_output_tokens).toBe(1400);
    expect(body.reasoning).toEqual({ effort: 'high' });
    expect(body.text).toEqual({ verbosity: 'low' });
  });

  it('returns a clear error when model JSON cannot be parsed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: '```json\nnot-valid-json\n```' }),
    });
    global.fetch = fetchMock as typeof fetch;
    process.env.OPENAI_API_KEY = 'env-openai-key-123456789';

    await expect(
      generateVariantsWithLlm({
        scenario: 'I missed a major client handoff and need to repair trust.',
        mode: 'Professional apology',
        tone: 'professional',
        formality: 'executive',
        accountabilityPosture: 'calibrated ownership',
        audience: 'client',
        medium: 'email',
        obnoxiousness: 10,
        sycophancy: 15,
        llm: {
          provider: 'openai',
          model: 'gpt-5.2',
        },
      }),
    ).rejects.toThrow('Failed to parse JSON from model response:');
  });
});
