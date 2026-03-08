import { afterEach, describe, expect, it, vi } from 'vitest';
import { rewriteWithLlm } from '@/lib/llm';
import type { LlmConfig } from '@/lib/contracts';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('llm provider integration', () => {
  it('uses responses API for GPT-5 models and omits temperature', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: 'Updated response text.' }),
    });
    global.fetch = fetchMock as typeof fetch;

    const llm: LlmConfig = {
      provider: 'openai',
      model: 'gpt-5.3',
      apiKey: 'test-key-123456789',
    };

    const result = await rewriteWithLlm('old', 'make concise', llm);

    expect(result).toBe('Updated response text.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.model).toBe('gpt-5.3');
    expect(body.temperature).toBeUndefined();
    expect(Array.isArray(body.input)).toBe(true);
  });

  it('uses chat completions API with temperature for non GPT-5 models', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Updated response text.' } }],
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    const llm: LlmConfig = {
      provider: 'openai',
      model: 'gpt-4.1-mini',
      apiKey: 'test-key-123456789',
    };

    const result = await rewriteWithLlm('old', 'make concise', llm);

    expect(result).toBe('Updated response text.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions');

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.model).toBe('gpt-4.1-mini');
    expect(body.temperature).toBe(0.7);
    expect(Array.isArray(body.messages)).toBe(true);
  });
});
