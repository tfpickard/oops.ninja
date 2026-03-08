import { describe, expect, it } from 'vitest';
import {
  createGeneration,
  saveGenerationVariants,
  listGenerationVariants,
  createShareToken,
  getSharedGeneration,
  createOrganization,
  listOrganizations,
  getBillingSnapshot,
  getAnalyticsSummary,
  listGenerations,
  createApiKey,
  deleteApiKey,
  trackModerationEvent,
  getAdminMetrics,
} from '@/lib/store';

describe('store phase2', () => {
  it('creates and retrieves shared generation artifacts', () => {
    const generation = createGeneration('test-user', 'Missed stakeholder sync', 'Executive apology');
    saveGenerationVariants(generation.id, [
      { kind: 'Most direct', text: 'I missed the sync and own the gap.' },
    ]);

    const share = createShareToken('test-user', generation.id, 1);
    const payload = getSharedGeneration(share.token);

    expect(payload?.generation.id).toBe(generation.id);
    expect(payload?.variants).toHaveLength(1);
  });

  it('supports organization and billing profile', () => {
    const created = createOrganization('org-user', 'Narrative Operations');
    const orgs = listOrganizations('org-user');
    const billing = getBillingSnapshot('org-user');

    expect(orgs.some((org) => org.id === created.id)).toBe(true);
    expect(billing.provider).toBe('stripe');
    expect(billing.status).toBe('active');
  });

  it('produces analytics mode rankings', () => {
    createGeneration('analytics-user', 'Incident A', 'Executive apology');
    createGeneration('analytics-user', 'Incident B', 'Executive apology');
    createGeneration('analytics-user', 'Incident C', 'Incident summary');

    const summary = getAnalyticsSummary('analytics-user');
    expect(summary.topModes[0]?.mode).toBe('Executive apology');
    expect(summary.totalGenerations).toBeGreaterThanOrEqual(3);
  });

  it('stores generation variants per generation id', () => {
    const generation = createGeneration('variant-user', 'Delayed rollout', 'Technical explanation');
    saveGenerationVariants(generation.id, [
      { kind: 'Most concise', text: 'Delay acknowledged.' },
      { kind: 'Most polished', text: 'We acknowledge the rollout delay and mitigation path.' },
    ]);

    const variants = listGenerationVariants(generation.id);
    expect(variants).toHaveLength(2);
  });

  it('supports pagination over generations', () => {
    createGeneration('paging-user', 'Incident 1', 'Short statement');
    createGeneration('paging-user', 'Incident 2', 'Short statement');
    createGeneration('paging-user', 'Incident 3', 'Short statement');

    const page = listGenerations('paging-user', 2, 1);
    expect(page.items).toHaveLength(2);
    expect(page.total).toBeGreaterThanOrEqual(3);
    expect(page.hasMore).toBe(false);
  });

  it('deletes api keys by id and tracks moderation events', () => {
    const issued = createApiKey('key-user');
    expect(deleteApiKey('key-user', issued.id)).toBe(true);
    expect(deleteApiKey('key-user', issued.id)).toBe(false);

    trackModerationEvent('key-user', 'policy restricted request');
    const metrics = getAdminMetrics();
    expect(metrics.moderationEvents24h).toBeGreaterThanOrEqual(1);
  });
});
