import { variantKinds } from './contracts';
import type { GenerationRequest } from './contracts';

export function generateVariants(request: GenerationRequest) {
  const intro = `Mode: ${request.mode}. Audience: ${request.audience}. Medium: ${request.medium}. Obnoxiousness: ${request.obnoxiousness}/100. Syrupy deference: ${request.sycophancy}/100.`;
  return variantKinds.map((variant) => ({
    kind: variant,
    text: `${intro} ${variant} response: I recognize the impact of this incident (${request.scenario}). I am taking immediate corrective action and will provide an accountable follow-through update.`,
  }));
}

export function rewriteText(text: string, transform: string) {
  return `${transform}: ${text.replace(/\s+/g, ' ').trim()}`;
}
