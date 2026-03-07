import type { GenerationRequest, VariantKind } from './contracts';

const variants: VariantKind[] = [
  'Most sincere',
  'Most concise',
  'Most polished',
  'Most believable',
  'Most diplomatic',
  'Most direct',
];

export function generateVariants(request: GenerationRequest) {
  const intro = `Mode: ${request.mode}. Audience: ${request.audience}. Medium: ${request.medium}.`;
  return variants.map((variant) => ({
    kind: variant,
    text: `${intro} ${variant} response: I recognize the impact of this incident (${request.scenario}). I am taking immediate corrective action and will provide an accountable follow-through update.`,
  }));
}

export function rewriteText(text: string, transform: string) {
  return `${transform}: ${text.replace(/\s+/g, ' ').trim()}`;
}
