import crypto from 'crypto';

export type GenerationRecord = {
  id: string;
  userId: string;
  scenario: string;
  createdAt: string;
};

const generations: GenerationRecord[] = [];
const usage = new Map<string, number>();
const apiKeys = new Map<string, { id: string; userId: string; prefix: string }[]>();

export function createGeneration(userId: string, scenario: string) {
  const record = { id: crypto.randomUUID(), userId, scenario, createdAt: new Date().toISOString() };
  generations.unshift(record);
  usage.set(userId, (usage.get(userId) ?? 0) + 1);
  return record;
}

export function listGenerations(userId: string) {
  return generations.filter((g) => g.userId === userId).slice(0, 50);
}

export function getUsage(userId: string) {
  return { totalGenerations: usage.get(userId) ?? 0 };
}

export function createApiKey(userId: string) {
  const key = `onk_${crypto.randomBytes(16).toString('hex')}`;
  const entry = { id: crypto.randomUUID(), userId, prefix: key.slice(0, 12) };
  apiKeys.set(userId, [...(apiKeys.get(userId) ?? []), entry]);
  return { ...entry, secret: key };
}

export function deleteApiKey(userId: string, id: string) {
  const existing = apiKeys.get(userId) ?? [];
  apiKeys.set(userId, existing.filter((k) => k.id !== id));
}

export function listApiKeys(userId: string) {
  return apiKeys.get(userId) ?? [];
}
