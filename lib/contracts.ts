import { z } from 'zod';

export const llmProviders = ['openai', 'anthropic', 'openrouter'] as const;
export const openAiGpt5VerbosityOptions = ['low', 'medium', 'high'] as const;
export const openAiGpt5ReasoningEffortOptions = ['minimal', 'none', 'low', 'medium', 'high', 'xhigh'] as const;
export type OpenAiGpt5Verbosity = (typeof openAiGpt5VerbosityOptions)[number];
export type OpenAiGpt5ReasoningEffort = (typeof openAiGpt5ReasoningEffortOptions)[number];

export const generationModes = [
  'Sincere apology',
  'Professional apology',
  'Executive apology',
  'Concise explanation',
  'Incident summary',
  'Ownership-forward response',
  'Responsibility-minimizing explanation',
  'Narrative reframing',
  'Corporate PR statement',
  'Manager-safe explanation',
  'Technical explanation',
  'Soft accountability message',
  'Relationship repair message',
  'Customer communication',
  'Internal team communication',
  'Public statement',
  'Slack message',
  'Email response',
  'Text message',
  'Call script',
  'Bullet-point summary',
  'Short statement',
  'Long form response',
  'Strategic mea culpa with action plan',
  'Calm damage-control memo',
  'Diplomatic “let’s align on next steps” note',
  'Polite but absolutely exhausted update',
  'Hyper-formal boardroom containment language',
  'Passive voice evasive special',
  'Regret-flavored status report',
  'The “calendar glitch” explanation',
  'Executive-sounding non-apology apology',
  'Heroic recovery narrative',
  'Highly strategic accountability fog',
  '“Per my last message” de-escalation',
  'Accidentally replied-all containment statement',
  'Friday deploy post-incident narrative',
  'Investor confidence stabilization brief',
  'Relationship truce communiqué',
  'Extremely concise “my bad” in enterprise format',
] as const;

export const toneOptions = [
  'empathetic',
  'neutral',
  'professional',
  'authoritative',
  'playful',
  'candid',
  'contrite',
  'blunt',
  'diplomatic',
  'warm',
  'sarcastic',
  'theatrical',
] as const;

export const formalityOptions = [
  'casual',
  'plainspoken',
  'conversational',
  'standard',
  'polished',
  'professional',
  'executive',
  'boardroom',
  'legalistic',
  'ceremonial',
  'bureaucratic',
  'ultra-formal',
] as const;

export const accountabilityPostureOptions = [
  'full ownership',
  'calibrated ownership',
  'corrective ownership',
  'empathetic ownership',
  'contextual framing',
  'lessons-learned framing',
  'responsibility diffusion',
  'shared-systems framing',
  'timeline-first framing',
  'narrative ambiguity',
  'strategic vagueness',
  'passive-voice shield',
] as const;

export const audienceOptions = [
  'investor',
  'customer',
  'enterprise customer',
  'prospective customer',
  'direct manager',
  'skip-level executive',
  'board of directors',
  'internal team',
  'cross-functional partner',
  'partner or vendor',
  'media or reporters',
  'public community',
  'regulator',
  'friends and family',
] as const;

export const mediumOptions = [
  'email',
  'slack message',
  'microsoft teams message',
  'text message',
  'phone call script',
  'meeting follow-up note',
  'one-on-one talking points',
  'all-hands script',
  'incident postmortem',
  'status page update',
  'support ticket response',
  'board memo',
  'press statement',
  'social media post',
] as const;

export const variantKinds = [
  'Most concise',
  'Most polished',
  'Most believable',
  'Most diplomatic',
  'Most kiss-ass',
  'Most duplicitous',
  'Most evasive',
  'Most defensive',
  'Most apathetic',
  'Most elaborate',
] as const;

export function isOpenAiGpt5Family(provider: string, model: string) {
  return provider === 'openai' && /^gpt-5(?:[.-]|$)/i.test(model.trim());
}

export function getSupportedOpenAiGpt5ReasoningEfforts(model: string): ReadonlyArray<OpenAiGpt5ReasoningEffort> {
  const normalized = model.trim().toLowerCase();

  if (normalized.startsWith('gpt-5.2-pro')) return ['medium', 'high', 'xhigh'] as const;
  if (normalized.startsWith('gpt-5-pro')) return ['high'] as const;
  if (normalized.startsWith('gpt-5.2-codex')) return ['low', 'medium', 'high', 'xhigh'] as const;
  if (normalized.startsWith('gpt-5.2')) return ['none', 'low', 'medium', 'high', 'xhigh'] as const;
  if (normalized.startsWith('gpt-5.1')) return ['none', 'low', 'medium', 'high'] as const;
  if (normalized.startsWith('gpt-5')) return ['minimal', 'low', 'medium', 'high'] as const;

  return [] as const;
}

export function getDefaultOpenAiGpt5ReasoningEffort(model: string): OpenAiGpt5ReasoningEffort {
  const normalized = model.trim().toLowerCase();

  if (normalized.startsWith('gpt-5.2-pro')) return 'medium' as const;
  if (normalized.startsWith('gpt-5-pro')) return 'high' as const;
  if (normalized.startsWith('gpt-5.2')) return 'none' as const;
  return 'medium' as const;
}

export function getDefaultOpenAiGpt5Verbosity(): OpenAiGpt5Verbosity {
  return 'medium' as const;
}

export const llmConfigSchema = z.object({
  provider: z.enum(llmProviders).default('openai'),
  model: z.string().min(3).default('gpt-5.2'),
  reasoningEffort: z.enum(openAiGpt5ReasoningEffortOptions).optional(),
  verbosity: z.enum(openAiGpt5VerbosityOptions).optional(),
}).superRefine((value, ctx) => {
  const supportsGpt5Controls = isOpenAiGpt5Family(value.provider, value.model);

  if (!supportsGpt5Controls) {
    if (value.reasoningEffort) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Reasoning effort is only supported for OpenAI GPT-5 family models.',
        path: ['reasoningEffort'],
      });
    }
    if (value.verbosity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Verbosity is only supported for OpenAI GPT-5 family models.',
        path: ['verbosity'],
      });
    }
    return;
  }

  if (value.reasoningEffort) {
    const supportedReasoningEfforts = getSupportedOpenAiGpt5ReasoningEfforts(value.model);
    if (!supportedReasoningEfforts.includes(value.reasoningEffort)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Reasoning effort "${value.reasoningEffort}" is not supported for ${value.model}.`,
        path: ['reasoningEffort'],
      });
    }
  }
});

const llmDefaults = {
  provider: 'openai' as const,
  model: 'gpt-5.2',
  reasoningEffort: getDefaultOpenAiGpt5ReasoningEffort('gpt-5.2'),
  verbosity: getDefaultOpenAiGpt5Verbosity(),
};

export const generationRequestSchema = z.object({
  scenario: z.string().min(10),
  mode: z.enum(generationModes),
  tone: z.enum(toneOptions),
  formality: z.enum(formalityOptions).default('standard'),
  accountabilityPosture: z.enum(accountabilityPostureOptions).default('calibrated ownership'),
  audience: z.string().default('coworker'),
  medium: z.string().default('email'),
  obnoxiousness: z.number().int().min(0).max(100).default(24),
  sycophancy: z.number().int().min(0).max(100).default(18),
  llm: llmConfigSchema.default(llmDefaults),
});

export const rewriteRequestSchema = z.object({
  text: z.string().min(5),
  transform: z.string().min(3),
  llm: llmConfigSchema.default(llmDefaults),
});

export type LlmConfig = z.infer<typeof llmConfigSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;
export type VariantKind = (typeof variantKinds)[number];
