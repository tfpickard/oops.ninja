import { z } from 'zod';

export const generationRequestSchema = z.object({
  scenario: z.string().min(10),
  mode: z.string().min(3),
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
});

export const rewriteRequestSchema = z.object({
  text: z.string().min(5),
  transform: z.string().min(3),
});

export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;

export type VariantKind =
  | 'Most sincere'
  | 'Most concise'
  | 'Most polished'
  | 'Most believable'
  | 'Most diplomatic'
  | 'Most direct';
