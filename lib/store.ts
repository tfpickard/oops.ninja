import crypto from 'crypto';

export type GenerationRecord = {
  id: string;
  userId: string;
  scenario: string;
  mode: string;
  createdAt: string;
};

export type GenerationVariantRecord = {
  id: string;
  generationId: string;
  kind: string;
  text: string;
};

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  members: string[];
  createdAt: string;
};

export type ShareRecord = {
  token: string;
  generationId: string;
  ownerUserId: string;
  expiresAt: string;
  createdAt: string;
};

const generations: GenerationRecord[] = [];
const generationVariants: GenerationVariantRecord[] = [];
const usage = new Map<string, number>();
const apiKeys = new Map<string, { id: string; userId: string; prefix: string; createdAt: string }[]>();
const organizations = new Map<string, OrganizationRecord[]>();
const sharedGenerations = new Map<string, ShareRecord>();
const moderationEvents: { userId: string; reason: string; createdAt: number }[] = [];

export function createGeneration(userId: string, scenario: string, mode: string) {
  const record = { id: crypto.randomUUID(), userId, scenario, mode, createdAt: new Date().toISOString() };
  generations.unshift(record);
  usage.set(userId, (usage.get(userId) ?? 0) + 1);
  return record;
}

export function saveGenerationVariants(generationId: string, variants: { kind: string; text: string }[]) {
  const rows = variants.map((variant) => ({
    id: crypto.randomUUID(),
    generationId,
    kind: variant.kind,
    text: variant.text,
  }));
  generationVariants.unshift(...rows);
}

export function listGenerations(userId: string, limit = 50, offset = 0) {
  const boundedLimit = Math.max(1, Math.min(100, limit));
  const boundedOffset = Math.max(0, offset);
  const items = generations.filter((g) => g.userId === userId);
  return {
    items: items.slice(boundedOffset, boundedOffset + boundedLimit),
    total: items.length,
    limit: boundedLimit,
    offset: boundedOffset,
    hasMore: boundedOffset + boundedLimit < items.length,
  };
}

export function getGenerationById(userId: string, generationId: string) {
  return generations.find((generation) => generation.userId === userId && generation.id === generationId);
}

export function listGenerationVariants(generationId: string) {
  return generationVariants.filter((variant) => variant.generationId === generationId);
}

export function getUsage(userId: string) {
  return { totalGenerations: usage.get(userId) ?? 0 };
}

export function createApiKey(userId: string) {
  const key = `onk_${crypto.randomBytes(16).toString('hex')}`;
  const entry = { id: crypto.randomUUID(), userId, prefix: key.slice(0, 12), createdAt: new Date().toISOString() };
  apiKeys.set(userId, [...(apiKeys.get(userId) ?? []), entry]);
  return { ...entry, secret: key };
}

export function deleteApiKey(userId: string, id: string) {
  const existing = apiKeys.get(userId) ?? [];
  const next = existing.filter((k) => k.id !== id);
  apiKeys.set(userId, next);
  return next.length !== existing.length;
}

export function listApiKeys(userId: string) {
  return apiKeys.get(userId) ?? [];
}

export function listOrganizations(userId: string) {
  const items = organizations.get(userId) ?? [];
  if (items.length) return items;

  const bootstrap: OrganizationRecord = {
    id: crypto.randomUUID(),
    name: 'Incident Communications Office',
    slug: 'incident-communications-office',
    ownerUserId: userId,
    members: [userId, 'communications-lead', 'legal-reviewer'],
    createdAt: new Date().toISOString(),
  };
  organizations.set(userId, [bootstrap]);
  return [bootstrap];
}

export function createOrganization(userId: string, name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const record: OrganizationRecord = {
    id: crypto.randomUUID(),
    name,
    slug: slug || `org-${crypto.randomBytes(3).toString('hex')}`,
    ownerUserId: userId,
    members: [userId],
    createdAt: new Date().toISOString(),
  };
  organizations.set(userId, [...listOrganizations(userId), record]);
  return record;
}

export function trackModerationEvent(userId: string, reason: string) {
  moderationEvents.unshift({ userId, reason, createdAt: Date.now() });
  if (moderationEvents.length > 5000) moderationEvents.length = 5000;
}

export function getAdminMetrics() {
  const totalUsers = new Set([
    ...generations.map((generation) => generation.userId),
    ...[...apiKeys.values()].flat().map((key) => key.userId),
  ]).size;

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const moderationEvents24h = moderationEvents.filter((event) => event.createdAt >= dayAgo).length;
  const now = Date.now();
  const activeShares = [...sharedGenerations.values()].filter(
    (share) => new Date(share.expiresAt).getTime() > now,
  ).length;

  return {
    totalUsers,
    totalGenerations: generations.length,
    totalApiKeys: [...apiKeys.values()].flat().length,
    activeShares,
    moderationEvents24h,
  };
}

export function getAnalyticsSummary(userId: string) {
  const userGenerations = generations.filter((generation) => generation.userId === userId);
  const modeCounts = userGenerations.reduce<Record<string, number>>((acc, generation) => {
    acc[generation.mode] = (acc[generation.mode] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalGenerations: userGenerations.length,
    topModes: Object.entries(modeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mode, count]) => ({ mode, count })),
    lastGenerationAt: userGenerations[0]?.createdAt ?? null,
  };
}

export function createShareToken(ownerUserId: string, generationId: string, expiryHours = 72) {
  const token = crypto.randomBytes(16).toString('hex');
  const share: ShareRecord = {
    token,
    generationId,
    ownerUserId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
  };
  sharedGenerations.set(token, share);
  return share;
}

export function getSharedGeneration(token: string) {
  const share = sharedGenerations.get(token);
  if (!share) return null;
  if (new Date(share.expiresAt).getTime() <= Date.now()) return null;

  const generation = generations.find((item) => item.id === share.generationId);
  if (!generation) return null;
  return {
    share,
    generation,
    variants: listGenerationVariants(generation.id),
  };
}

export function getBillingSnapshot(userId: string) {
  const monthlyUsage = getUsage(userId).totalGenerations;
  const overage = Math.max(0, monthlyUsage - 2500);
  return {
    plan: 'Professional',
    status: 'active',
    provider: 'stripe',
    monthlyQuota: 2500,
    monthlyUsage,
    projectedOverageUnits: overage,
  };
}
