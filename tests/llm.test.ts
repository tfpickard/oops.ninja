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
      model: 'gpt-5.3',
    };

    const result = await rewriteWithLlm('old', 'make concise', llm);

    expect(result).toBe('Updated response text.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(body.model).toBe('gpt-5.3');
    expect(body.max_output_tokens).toBe(700);
    expect(body.temperature).toBeUndefined();
    expect(Array.isArray(body.input)).toBe(true);
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
        model: 'gpt-5.3',
      }),
    ).rejects.toThrow('OpenAI API key is not configured. Set OPENAI_API_KEY in the server environment.');
  });

  it('normalizes generation variants from generic fenced JSON output', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: `\`\`\`
[
  { "kind": "Most sincere", "text": "I own this and I am fixing it now." },
  { "kind": "Most direct", "text": "I missed this. Here is the correction plan." }
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
        model: 'gpt-5.3',
      },
    });

    expect(variants).toHaveLength(6);
    expect(variants[0]).toEqual({
      kind: 'Most sincere',
      text: 'I own this and I am fixing it now.',
    });
    expect(variants[5]).toEqual({
      kind: 'Most direct',
      text: 'I missed this. Here is the correction plan.',
    });
    expect(variants[1].text).toContain('Unable to generate this variant.');
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
          model: 'gpt-5.3',
        },
      }),
    ).rejects.toThrow('Failed to parse JSON from model response:');
  });
});
