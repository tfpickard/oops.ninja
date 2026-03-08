import { variantKinds } from './contracts';
import type { GenerationRequest, LlmConfig, VariantKind } from './contracts';

type VariantOutput = { kind: VariantKind; text: string };
type ResolvedLlmConfig = LlmConfig & { apiKey: string };

type OpenAiMessage = { role: 'system' | 'user'; content: string };
type JsonRecord = Record<string, unknown>;

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

const requestTimeoutMs = 15000;
const generationMaxOutputTokens = 1400;
const rewriteMaxOutputTokens = 700;

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

function stripCodeFence(raw: string) {
  const jsonFenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const genericFenced = raw.match(/```\s*([\s\S]*?)```/);
  return (jsonFenced?.[1] ?? genericFenced?.[1] ?? raw).trim();
}

function parseJsonPayload(raw: string) {
  const source = stripCodeFence(raw);
  const arrayStart = source.indexOf('[');
  const arrayEnd = source.lastIndexOf(']');
  const jsonSource = arrayStart >= 0 && arrayEnd > arrayStart ? source.slice(arrayStart, arrayEnd + 1).trim() : source;

  try {
    return JSON.parse(jsonSource);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from model response: ${detail}`);
  }
}

function normalizeVariantMap(byKind: Map<string, string>): VariantOutput[] {
  return variantKinds.map((kind) => ({
    kind,
    text: byKind.get(kind) ?? `${kind}: Unable to generate this variant.`,
  }));
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

  return normalizeVariantMap(byKind);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseLabeledVariants(raw: string): VariantOutput[] | null {
  const source = stripCodeFence(raw).replace(/\r/g, '').trim();
  const headerPattern = new RegExp(
    `(^|\\n)\\s*(?:#+\\s*)?(?:\\d+[.)]\\s*)?(?:[-*]\\s*)?\\*{0,2}\\[?(${variantKinds.map(escapeRegExp).join('|')})\\]?\\*{0,2}\\s*:\\s*`,
    'g',
  );
  const matches = Array.from(source.matchAll(headerPattern));
  if (!matches.length) return null;

  const byKind = new Map<string, string>();
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const kind = match[2]?.trim();
    if (!kind) continue;

    const contentStart = (match.index ?? 0) + match[0].length;
    const nextMatchIndex = matches[index + 1]?.index ?? source.length;
    const text = source.slice(contentStart, nextMatchIndex).replace(/\s*\n+\s*/g, ' ').trim();
    if (text) {
      byKind.set(kind, text);
    }
  }

  return byKind.size ? normalizeVariantMap(byKind) : null;
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

function describeDial(value: number, levels: Array<[number, string]>) {
  return levels.find(([max]) => value <= max)?.[1] ?? levels[levels.length - 1][1];
}

function describeObnoxiousnessDirective(value: number) {
  if (value <= 15) {
    return 'Stay understated. No dramatics, no swagger, no theatrical punctuation.';
  }
  if (value <= 35) {
    return 'Keep it composed with subtle personality. Avoid grandstanding.';
  }
  if (value <= 55) {
    return 'Use visible personality and color. Light rhetorical flair is welcome.';
  }
  if (value <= 75) {
    return 'Be boldly performative: punchy phrasing, vivid verbs, confident swagger.';
  }
  if (value <= 90) {
    return 'Go loud and theatrical with dramatic phrasing and overt flair while staying coherent.';
  }
  return 'Go maximum obnoxious: include one short ALL-CAPS fragment, at least one exclamation mark, and one playful overblown metaphor.';
}

function describeSycophancyDirective(value: number) {
  if (value <= 15) {
    return 'Keep flattery near zero. Be respectful but direct.';
  }
  if (value <= 35) {
    return 'Use basic politeness only. Avoid gushing praise.';
  }
  if (value <= 55) {
    return 'Sound warm and accommodating with moderate praise.';
  }
  if (value <= 75) {
    return 'Be clearly deferential with frequent appreciation language.';
  }
  if (value <= 90) {
    return 'Use lavish praise and eager-to-please language throughout.';
  }
  return 'Go fully syrupy and shamelessly flattering without becoming incoherent.';
}

function describeFormalityDirective(formality: string) {
  if (['boardroom', 'legalistic', 'ceremonial', 'bureaucratic', 'ultra-formal'].includes(formality)) {
    return 'Maintain the requested formal register, but keep wording concrete and readable.';
  }
  return 'Favor modern conversational cadence and avoid sterile corporate boilerplate.';
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  provider: keyof typeof providerLabels,
): Promise<{ response: Response; data: JsonRecord }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const data = (await response.json()) as JsonRecord;
    return { response, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${providerLabels[provider]} request timed out after ${requestTimeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function invokeOpenAi(llm: ResolvedLlmConfig, messages: OpenAiMessage[], maxOutputTokens: number) {
  if (isGpt5Model(llm.model)) {
    const { response, data } = await fetchJsonWithTimeout(
      'https://api.openai.com/v1/responses',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${llm.apiKey}`,
        },
        body: JSON.stringify({
          model: llm.model,
          max_output_tokens: maxOutputTokens,
          input: messages,
        }),
      },
      'openai',
    );

    if (!response.ok) {
      throw new Error((data.error as JsonRecord | undefined)?.message as string ?? 'OpenAI request failed.');
    }

    const outputText = typeof data.output_text === 'string' ? data.output_text : extractTextFromResponseOutput(data.output);
    return outputText;
  }

  const { response, data } = await fetchJsonWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        model: llm.model,
        max_tokens: maxOutputTokens,
        temperature: 0.7,
        messages,
      }),
    },
    'openai',
  );

  if (!response.ok) {
    throw new Error((data.error as JsonRecord | undefined)?.message as string ?? 'OpenAI request failed.');
  }

  return ((data.choices as Array<JsonRecord> | undefined)?.[0]?.message as JsonRecord | undefined)?.content as string;
}

async function invokeAnthropic(llm: ResolvedLlmConfig, messages: OpenAiMessage[], maxOutputTokens: number) {
  const userPrompt = messages.filter((entry) => entry.role === 'user').map((entry) => entry.content).join('\n\n');
  const systemPrompt = messages.filter((entry) => entry.role === 'system').map((entry) => entry.content).join('\n\n');

  const { response, data } = await fetchJsonWithTimeout(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': llm.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: llm.model,
        max_tokens: maxOutputTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    },
    'anthropic',
  );

  if (!response.ok) {
    throw new Error((data.error as JsonRecord | undefined)?.message as string ?? 'Anthropic request failed.');
  }

  return ((data.content as Array<JsonRecord> | undefined)?.[0]?.text as string) ?? '';
}

async function invokeOpenRouter(llm: ResolvedLlmConfig, messages: OpenAiMessage[], maxOutputTokens: number) {
  const { response, data } = await fetchJsonWithTimeout(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${llm.apiKey}`,
      },
      body: JSON.stringify({
        model: llm.model,
        max_tokens: maxOutputTokens,
        temperature: 0.7,
        messages,
      }),
    },
    'openrouter',
  );

  if (!response.ok) {
    throw new Error((data.error as JsonRecord | undefined)?.message as string ?? 'OpenRouter request failed.');
  }

  return ((data.choices as Array<JsonRecord> | undefined)?.[0]?.message as JsonRecord | undefined)?.content as string;
}

async function invokeModel(llm: LlmConfig, messages: OpenAiMessage[], maxOutputTokens: number) {
  const resolved = resolveLlmConfig(llm);

  if (resolved.provider === 'anthropic') {
    return invokeAnthropic(resolved, messages, maxOutputTokens);
  }
  if (resolved.provider === 'openrouter') {
    return invokeOpenRouter(resolved, messages, maxOutputTokens);
  }
  return invokeOpenAi(resolved, messages, maxOutputTokens);
}

export async function generateVariantsWithLlm(request: GenerationRequest) {
  const obnoxiousnessProfile = describeDial(request.obnoxiousness, [
    [20, 'restrained and almost invisible'],
    [40, 'controlled with a faintly polished edge'],
    [60, 'showy and a little self-conscious'],
    [80, 'performative and impossible to miss'],
    [100, 'maximalist, theatrical, and borderline insufferable'],
  ]);
  const sycophancyProfile = describeDial(request.sycophancy, [
    [20, 'plainspoken and low-flattery'],
    [40, 'respectful without fawning'],
    [60, 'warmly deferential'],
    [80, 'velvety and eager to please'],
    [100, 'groveling, syrupy, and shamelessly flattering'],
  ]);
  const prompt = `Create six response variants for the scenario below.
Return plain text only. Do not use JSON, markdown, code fences, bullets, or commentary before/after the variants.
Use these exact labels in this exact order, one block per label:
${variantKinds.map((kind) => `${kind}: <text>`).join('\n')}
Steering contract (hard requirements):
- Treat every selector as a hard constraint, not a soft suggestion.
- Keep each variant to 2-5 sentences as a single paragraph after its label.
- Make the six variants materially different by their requested kind, but keep them in the same scenario.
- ${describeFormalityDirective(request.formality)}
- Obnoxiousness rule: ${describeObnoxiousnessDirective(request.obnoxiousness)}
- Sycophancy rule: ${describeSycophancyDirective(request.sycophancy)}
- If both dials are above 85, produce intentionally absurd corporate-theater language while keeping meaning clear.

Scenario: ${request.scenario}
Mode: ${request.mode}
Tone: ${request.tone}
Formality: ${request.formality}
Accountability posture: ${request.accountabilityPosture}
Audience: ${request.audience}
Medium: ${request.medium}
Obnoxiousness dial: ${request.obnoxiousness}/100 (${obnoxiousnessProfile})
Syrupy kiss-ass dial: ${request.sycophancy}/100 (${sycophancyProfile})`;

  const output = await invokeModel(
    request.llm,
    [
      {
        role: 'system',
        content:
          'You are a highly steerable communications copywriter. Follow user controls exactly, avoid generic safe prose, and return only the labeled variant blocks requested by the user.',
      },
      { role: 'user', content: prompt },
    ],
    generationMaxOutputTokens,
  );

  if (!output) {
    throw new Error('Model did not return output.');
  }

  const labeledVariants = parseLabeledVariants(output);
  if (labeledVariants) {
    return labeledVariants;
  }

  return normalizeVariants(parseJsonPayload(output));
}

export async function rewriteWithLlm(text: string, transform: string, llm: LlmConfig) {
  const output = await invokeModel(
    llm,
    [
      {
        role: 'system',
        content: 'You rewrite communication snippets. Return plain text only and keep meaning intact unless asked otherwise.',
      },
      {
        role: 'user',
        content: `Rewrite the following text according to this transform: ${transform}\n\nText:\n${text}`,
      },
    ],
    rewriteMaxOutputTokens,
  );

  if (!output) {
    throw new Error('Model did not return output.');
  }

  return output.trim();
}
