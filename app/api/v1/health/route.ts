import crypto from 'crypto';
import { ok } from '@/lib/http';

export async function GET() {
  return ok({ status: 'ok', service: 'oops.ninja-alpha' }, crypto.randomUUID());
}
