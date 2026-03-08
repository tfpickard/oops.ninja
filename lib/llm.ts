import { variantKinds } from './contracts';
import type { GenerationRequest, LlmConfig, VariantKind } from './contracts';

type VariantOutput = { kind: VariantKind; text: string };
type ResolvedLlmConfig = LlmConfig & { apiKey: string };

type OpenAiMessage = { role: 'system' | 'user'; content: string };

const providerEnvVars = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
} as const;

const providerLabels = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  openrouter: 'OpenRouter',
} as const;

function resolveLlmConfig(llm: LlmConfig): ResolvedLlmConfig {
  const envVar = providerEnvVars[llm.provider];
  const apiKey = process.env[envVar]?.trim();

  if (!apiKey) {
    throw new Error(`${providerLabels[llm.provider]} API key is not configured. Set ${envVar} in the server environment.`);
  }

  return {
    ...llm,
    apiKey,
  };
}

function parseJsonPayload(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const source = fenced?.[1] ?? raw;
  return JSON.parse(source);
}

function normalizeVariants(payload: unknown): VariantOutput[] {
  if (!Array.isArray(payload)) {
    throw new Error('Model response did not return an array.');
  }

  const byKind = new Map<string, string>();
  for (const row of payload) {
    if (!row || typeof row !== 'object') continue;
    const record = row as { kind?: unknown; text?: unknown };
    if (typeof record.kind !== 'string' || typeof record.text !== 'string') continue;
    byKind.set(record.kind, record.text.trim());
  }

  return variantKinds.map((kind) => ({
    kind,
    text: byKind.get(kind) ?? `${kind}: Unable to generate this variant.`,
  }));
}

function isGpt5Model(model: string) {
  return model.toLowerCase().startsWith('gpt-5');
}

function extractTextFromResponseOutput(output: unknown): string {
  if (!Array.isArray(output)) return '';

  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const chunk of content) {
      if (!chunk || typeof chunk !== 'object') continue;
      const text = (chunk as { text?: unknown }).text;
      if (typeof text === 'string' && text.trim()) {
        return text;
      }
    }
  }

  return '';
}

async function invokeOpenAi(llm: ResolvedLlmConfig, messages: OpenAiMessage[]) {
  if (isGpt5Model(llm.model)) {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        model: llm.model,
        input: messages,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message ?? 'OpenAI request failed.');
    }

    const outputText = typeof data?.output_text === 'string' ? data.output_text : extractTextFromResponseOutput(data?.output);
    return outputText;
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${llm.apiKey}`,
    },
    body: JSON.stringify({
      model: llm.model,
      temperature: 0.7,
      messages,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? 'OpenAI request failed.');
  }

  return data?.choices?.[0]?.message?.content as string;
}

async function invokeAnthropic(llm: ResolvedLlmConfig, messages: OpenAiMessage[]) {
  const userPrompt = messages.filter((entry) => entry.role === 'user').map((entry) => entry.content).join('\n\n');
  const systemPrompt = messages.filter((entry) => entry.role === 'system').map((entry) => entry.content).join('\n\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': llm.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: llm.model,
      max_tokens: 700,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? 'Anthropic request failed.');
  }

  return data?.content?.[0]?.text as string;
}

async function invokeOpenRouter(llm: ResolvedLlmConfig, messages: OpenAiMessage[]) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${llm.apiKey}`,
    },
    body: JSON.stringify({
      model: llm.model,
      temperature: 0.7,
      messages,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ?? 'OpenRouter request failed.');
  }

  return data?.choices?.[0]?.message?.content as string;
}

async function invokeModel(llm: LlmConfig, messages: OpenAiMessage[]) {
  const resolved = resolveLlmConfig(llm);

  if (resolved.provider === 'anthropic') return invokeAnthropic(resolved, messages);
  if (resolved.provider === 'openrouter') return invokeOpenRouter(resolved, messages);
  return invokeOpenAi(resolved, messages);
}

export async function generateVariantsWithLlm(request: GenerationRequest) {
  const prompt = `Create six apology variants for the scenario below.
Return JSON array only with objects containing {"kind": string, "text": string}.
Use these exact kinds in order: ${variantKinds.join(', ')}.

Scenario: ${request.scenario}
Mode: ${request.mode}
Tone: ${request.tone}
Formality: ${request.formality}
Accountability posture: ${request.accountabilityPosture}
Audience: ${request.audience}
Medium: ${request.medium}`;

  const output = await invokeModel(request.llm, [
    {
      role: 'system',
      content: 'You are a communications strategist. Keep each variant to 2-4 sentences. Avoid markdown.',
    },
    { role: 'user', content: prompt },
  ]);

  if (!output) {
    throw new Error('Model did not return output.');
  }

  return normalizeVariants(parseJsonPayload(output));
}

export async function rewriteWithLlm(text: string, transform: string, llm: LlmConfig) {
  const output = await invokeModel(llm, [
    {
      role: 'system',
      content: 'You rewrite communication snippets. Return plain text only and keep meaning intact unless asked otherwise.',
    },
    {
      role: 'user',
      content: `Rewrite the following text according to this transform: ${transform}\n\nText:\n${text}`,
    },
  ]);

  if (!output) {
    throw new Error('Model did not return output.');
  }

  return output.trim();
}
