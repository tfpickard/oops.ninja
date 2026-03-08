import { z } from 'zod';

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

export const variantKinds = [
  'Most sincere',
  'Most concise',
  'Most polished',
  'Most believable',
  'Most diplomatic',
  'Most direct',
] as const;

export const llmConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'openrouter']).default('openai'),
  model: z.string().min(3).default('gpt-5.3'),
});

const llmDefaults = {
  provider: 'openai' as const,
  model: 'gpt-5.3',
};

export const generationRequestSchema = z.object({
  scenario: z.string().min(10),
  mode: z.enum(generationModes),
  tone: z.enum(['empathetic', 'neutral', 'professional', 'authoritative']),
  formality: z.enum(['casual', 'standard', 'executive']).default('standard'),
  accountabilityPosture: z.enum([
    'full ownership',
    'calibrated ownership',
    'contextual framing',
    'responsibility diffusion',
    'narrative ambiguity',
  ]).default('calibrated ownership'),
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
