import crypto from 'crypto';
import { ok } from '@/lib/http';

const presets = [
  'The Frazzled Engineer',
  'The Corporate Spokesperson',
  'The Middle Manager',
  'The Startup Founder',
  'The Concerned Partner',
  'The Diplomatic Executive',
  'The Burned-Out PM',
  'The Intern',
  'The Technical Explainer',
  'The Calm De-Escalator',
];

export async function GET() {
  return ok({ presets }, crypto.randomUUID());
}
