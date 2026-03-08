'use client';

import { useEffect, useMemo, useState } from 'react';
import { generationModes } from '@/lib/contracts';
import type { GenerationRequest, RewriteRequest } from '@/lib/contracts';

type ApiKeyEntry = { id: string; prefix: string; createdAt: string };
type IssuedKey = ApiKeyEntry & { secret: string };
type GenerationEntry = { id: string; scenario: string; mode: string; createdAt: string };
type GenerationVariant = { kind: string; text: string };
type OrgEntry = { id: string; name: string; slug: string; members: string[] };
type AnalyticsSummary = {
  totalGenerations: number;
  topModes: Array<{ mode: string; count: number }>;
  lastGenerationAt: string | null;
};
type BillingData = {
  billing: {
    plan: string;
    status: string;
    provider: string;
    monthlyQuota: number;
    monthlyUsage: number;
    projectedOverageUnits: number;
  };
  portal: {
    status: string;
    checkoutUrl: string;
    customerPortalUrl: string;
  };
};
type GenerationPage = {
  items: GenerationEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};
type GenerationOutput = {
  generationId: string;
  variants: GenerationVariant[];
};
type ShareMeta = {
  url: string;
  expiresAt: string;
};

const toneOptions: GenerationRequest['tone'][] = ['empathetic', 'neutral', 'professional', 'authoritative'];
const formalityOptions: GenerationRequest['formality'][] = ['casual', 'standard', 'executive'];
const accountabilityOptions: GenerationRequest['accountabilityPosture'][] = [
  'full ownership',
  'calibrated ownership',
  'contextual framing',
  'responsibility diffusion',
  'narrative ambiguity',
];
const llmDefaults = {
  provider: 'openai' as const,
  model: 'gpt-5.3',
};

const defaults: GenerationRequest = {
  scenario: 'I missed an investor update call and need to restore confidence with a clear action plan.',
  mode: 'Professional apology',
  tone: 'professional',
  formality: 'executive',
  accountabilityPosture: 'calibrated ownership',
  audience: 'investor',
  medium: 'email',
  obnoxiousness: 24,
  sycophancy: 18,
  llm: llmDefaults,
};

const rewriteDefaults: RewriteRequest = {
  text: 'We had a miss in coordination and I own the breakdown.',
  transform: 'Make this more concise',
  llm: llmDefaults,
};

function formatDateTime(value: string | null) {
  if (!value) return 'No activity yet';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function describeDial(value: number, levels: Array<[number, string]>) {
  return levels.find(([max]) => value <= max)?.[1] ?? levels[levels.length - 1][1];
}

function clampPercentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

export function GeneratorClient() {
  const [form, setForm] = useState<GenerationRequest>(defaults);
  const [rewrite, setRewrite] = useState<RewriteRequest>(rewriteDefaults);
  const [generated, setGenerated] = useState<GenerationOutput | null>(null);
  const [rewriteOutput, setRewriteOutput] = useState<string>('');
  const [historyPage, setHistoryPage] = useState<GenerationPage>({ items: [], total: 0, limit: 5, offset: 0, hasMore: false });
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [orgs, setOrgs] = useState<OrgEntry[]>([]);
  const [usage, setUsage] = useState<number>(0);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [shareMeta, setShareMeta] = useState<ShareMeta | null>(null);
  const [latestIssuedKey, setLatestIssuedKey] = useState<IssuedKey | null>(null);
  const [message, setMessage] = useState<string>('Studio ready.');
  const [error, setError] = useState<string>('');
  const [isWorking, setIsWorking] = useState(false);

  const canShare = useMemo(() => historyPage.items.length > 0, [historyPage.items.length]);
  const obnoxiousnessLabel = describeDial(form.obnoxiousness, [
    [20, 'restrained'],
    [40, 'controlled'],
    [60, 'showy'],
    [80, 'performative'],
    [100, 'insufferable'],
  ]);
  const sycophancyLabel = describeDial(form.sycophancy, [
    [20, 'plainspoken'],
    [40, 'respectful'],
    [60, 'deferential'],
    [80, 'velvety'],
    [100, 'groveling'],
  ]);
  const billingUsagePercentage = clampPercentage(
    billing?.billing.monthlyUsage ?? 0,
    billing?.billing.monthlyQuota ?? 0,
  );

  async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ requestId: string; data: T }> {
    const res = await fetch(url, init);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message ?? 'Request failed');
    }
    return data;
  }

  async function refreshData(offset = 0) {
    const [historyData, keysData, usageData, orgData, analyticsData, billingData] = await Promise.all([
      fetchJson<GenerationPage>(`/api/v1/generations?limit=${historyPage.limit}&offset=${offset}`),
      fetchJson<{ items: ApiKeyEntry[] }>('/api/v1/api-keys'),
      fetchJson<{ totalGenerations: number }>('/api/v1/usage'),
      fetchJson<{ items: OrgEntry[] }>('/api/v1/organizations'),
      fetchJson<{ summary: AnalyticsSummary }>('/api/v1/analytics/summary'),
      fetchJson<BillingData>('/api/v1/billing/portal'),
    ]);

    setHistoryPage(historyData.data);
    setKeys(keysData.data.items ?? []);
    setUsage(usageData.data.totalGenerations ?? 0);
    setOrgs(orgData.data.items ?? []);
    setAnalytics(analyticsData.data.summary ?? null);
    setBilling(billingData.data ?? null);
  }

  useEffect(() => {
    refreshData().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateLlmConfig() {
    const model = form.llm.model.trim();
    if (!model || model.length < 3) {
      setError('Model is required and must be at least 3 characters long.');
      return false;
    }

    setError('');
    return true;
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
      setError('');
    } catch {
      setError('Clipboard access failed.');
    }
  }

  async function generate() {
    if (!validateLlmConfig()) return;

    setIsWorking(true);
    setError('');
    try {
      const data = await fetchJson<GenerationOutput>('/api/v1/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      setGenerated(data.data);
      setShareMeta(null);
      setMessage('Six variants generated and saved to your history.');
      await refreshData(0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsWorking(false);
    }
  }

  async function runRewrite() {
    if (!validateLlmConfig()) return;

    setIsWorking(true);
    setError('');
    try {
      const data = await fetchJson<{ output: string }>('/api/v1/rewrite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...rewrite, llm: form.llm }),
      });
      setRewriteOutput(data.data.output ?? '');
      setMessage('Rewrite polished and ready to use.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsWorking(false);
    }
  }

  async function createKey() {
    setError('');
    try {
      const data = await fetchJson<{ key: IssuedKey }>('/api/v1/api-keys', { method: 'POST' });
      setLatestIssuedKey(data.data.key);
      await refreshData(historyPage.offset);
      setMessage('New API key issued. Copy it now; the secret is only shown once.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function revokeKey(id: string) {
    setError('');
    try {
      await fetchJson(`/api/v1/api-keys/${id}`, { method: 'DELETE' });
      await refreshData(historyPage.offset);
      setMessage('API key revoked.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function createOrg() {
    setError('');
    try {
      await fetchJson('/api/v1/organizations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: `Narrative Studio ${orgs.length + 1}` }),
      });
      await refreshData(historyPage.offset);
      setMessage('Workspace created.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function refreshBilling() {
    setError('');
    try {
      const data = await fetchJson<BillingData>('/api/v1/billing/portal');
      setBilling(data.data);
      setMessage('Billing snapshot refreshed.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function shareLatest() {
    if (!historyPage.items[0]) return;
    setError('');
    try {
      const data = await fetchJson<{ share?: { url: string; expiresAt: string } }>(
        `/api/v1/generations/${historyPage.items[0].id}/share`,
        { method: 'POST' },
      );
      const rawUrl = data.data.share?.url ?? '';
      const absoluteUrl = rawUrl ? new URL(rawUrl, window.location.origin).toString() : '';

      setShareMeta(
        absoluteUrl
          ? {
              url: absoluteUrl,
              expiresAt: data.data.share?.expiresAt ?? '',
            }
          : null,
      );
      setMessage('Share link created for the latest saved generation.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function loadHistoryPage(nextOffset: number) {
    setError('');
    try {
      await refreshData(nextOffset);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="dashboard-stack">
      <section className="overview-grid">
        <article className="summary-card">
          <p className="eyebrow">Provider</p>
          <strong>{form.llm.provider}</strong>
          <span>{form.llm.model}</span>
        </article>
        <article className="summary-card">
          <p className="eyebrow">Tone profile</p>
          <strong>{obnoxiousnessLabel}</strong>
          <span>{sycophancyLabel} and audience-aware</span>
        </article>
        <article className="summary-card">
          <p className="eyebrow">Generations</p>
          <strong>{usage}</strong>
          <span>{analytics?.topModes[0]?.mode ?? 'No dominant mode yet'}</span>
        </article>
        <article className="summary-card">
          <p className="eyebrow">Last activity</p>
          <strong>{formatDateTime(analytics?.lastGenerationAt ?? null)}</strong>
          <span>{orgs.length} workspace{orgs.length === 1 ? '' : 's'}</span>
        </article>
      </section>

      <div className="studio-grid">
        <section className="card studio-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Compose</p>
              <h2>Generate a polished response</h2>
            </div>
            <div className="provider-pill">
              <span>{form.llm.provider}</span>
              <strong>{form.llm.model}</strong>
            </div>
          </div>

          <label className="field field--wide">
            Scenario
            <textarea
              value={form.scenario}
              onChange={(e) => setForm({ ...form, scenario: e.target.value })}
            />
          </label>

          <div className="control-grid control-grid--2">
            <label>
              Mode
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value as GenerationRequest['mode'] })}
              >
                {generationModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tone
              <select
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value as GenerationRequest['tone'] })}
              >
                {toneOptions.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="control-grid control-grid--2">
            <label>
              Formality
              <select
                value={form.formality}
                onChange={(e) => setForm({ ...form, formality: e.target.value as GenerationRequest['formality'] })}
              >
                {formalityOptions.map((formality) => (
                  <option key={formality} value={formality}>
                    {formality}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Accountability posture
              <select
                value={form.accountabilityPosture}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accountabilityPosture: e.target.value as GenerationRequest['accountabilityPosture'],
                  })
                }
              >
                {accountabilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="control-grid control-grid--2">
            <label>
              Audience
              <input
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              />
            </label>
            <label>
              Medium
              <input
                value={form.medium}
                onChange={(e) => setForm({ ...form, medium: e.target.value })}
              />
            </label>
          </div>

          <section className="tuning-panel">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">Flavor tuning</p>
                <h3>Push the response past tasteful if you want to.</h3>
              </div>
              <p className="muted">
                These dials intentionally let you steer the output from measured to hilariously overcooked.
              </p>
            </div>

            <div className="tuning-grid">
              <label className="dial-card">
                <div className="dial-card__header">
                  <div>
                    <span className="dial-card__label">Obnoxiousness</span>
                    <small>{obnoxiousnessLabel}</small>
                  </div>
                  <strong>{form.obnoxiousness}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={form.obnoxiousness}
                  onChange={(e) => setForm({ ...form, obnoxiousness: Number(e.target.value) })}
                />
                <div className="dial-card__scale">
                  <span>restrained</span>
                  <span>insufferable</span>
                </div>
              </label>

              <label className="dial-card">
                <div className="dial-card__header">
                  <div>
                    <span className="dial-card__label">Syrupy kiss-ass</span>
                    <small>{sycophancyLabel}</small>
                  </div>
                  <strong>{form.sycophancy}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={form.sycophancy}
                  onChange={(e) => setForm({ ...form, sycophancy: Number(e.target.value) })}
                />
                <div className="dial-card__scale">
                  <span>plainspoken</span>
                  <span>groveling</span>
                </div>
              </label>
            </div>
          </section>

          <section className="provider-config">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">Provider settings</p>
                <h3>Switch models without touching secrets.</h3>
              </div>
              <p className="muted">Credentials are read from the server environment.</p>
            </div>
            <div className="control-grid control-grid--2">
              <label>
                Provider
                <select
                  value={form.llm.provider}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      llm: {
                        ...form.llm,
                        provider: e.target.value as GenerationRequest['llm']['provider'],
                      },
                    })
                  }
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </label>
              <label>
                Model
                <input
                  value={form.llm.model}
                  onChange={(e) => setForm({ ...form, llm: { ...form.llm, model: e.target.value } })}
                />
              </label>
            </div>
          </section>

          <div className="action-row">
            <button onClick={generate} disabled={isWorking}>
              {isWorking ? 'Generating...' : 'Generate variants'}
            </button>
            <button
              className="button-secondary"
              onClick={() => setForm(defaults)}
              disabled={isWorking}
            >
              Reset dials
            </button>
          </div>

          <div className={`status-banner${error ? ' status-banner--error' : ''}`}>
            <p className="eyebrow">{error ? 'Issue' : isWorking ? 'Working' : 'Studio status'}</p>
            <strong>{error ? error : message}</strong>
          </div>
        </section>

        <section className="card results-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Output deck</p>
              <h2>Generated variants</h2>
            </div>
            <div className="action-row action-row--tight">
              <button
                className="button-secondary"
                onClick={shareLatest}
                disabled={!canShare}
              >
                Create share link
              </button>
            </div>
          </div>

          {shareMeta ? (
            <div className="share-strip">
              <div>
                <p className="eyebrow">Latest share</p>
                <strong>{shareMeta.url}</strong>
                <span>Expires {formatDateTime(shareMeta.expiresAt)}</span>
              </div>
              <button className="button-secondary" onClick={() => copyText(shareMeta.url, 'Share link')}>
                Copy link
              </button>
            </div>
          ) : null}

          {generated ? (
            <div className="variant-grid">
              {generated.variants.map((variant) => (
                <article className="variant-card" key={variant.kind}>
                  <div className="variant-card__header">
                    <span className="pill">{variant.kind}</span>
                    <button
                      className="button-inline"
                      onClick={() => copyText(variant.text, variant.kind)}
                    >
                      Copy
                    </button>
                  </div>
                  <p>{variant.text}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-panel">
              <p className="eyebrow">No generation yet</p>
              <h3>Run the studio once and the response deck will land here.</h3>
              <p>
                Instead of raw payloads, this space now shows readable variants you can compare, copy, and
                share.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-secondary">
        <section className="card rewrite-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Rewrite</p>
              <h2>Refine an existing message</h2>
            </div>
          </div>

          <div className="rewrite-layout">
            <div className="rewrite-controls">
              <label>
                Input
                <textarea
                  value={rewrite.text}
                  onChange={(e) => setRewrite({ ...rewrite, text: e.target.value })}
                />
              </label>
              <label>
                Transform
                <input
                  value={rewrite.transform}
                  onChange={(e) => setRewrite({ ...rewrite, transform: e.target.value })}
                />
              </label>
              <button onClick={runRewrite} disabled={isWorking}>
                {isWorking ? 'Rewriting...' : 'Rewrite text'}
              </button>
            </div>

            <div className="rewrite-preview">
              <p className="eyebrow">Preview</p>
              {rewriteOutput ? (
                <>
                  <p className="rewrite-preview__text">{rewriteOutput}</p>
                  <button
                    className="button-secondary"
                    onClick={() => copyText(rewriteOutput, 'Rewrite')}
                  >
                    Copy rewrite
                  </button>
                </>
              ) : (
                <div className="empty-panel empty-panel--compact">
                  <h3>No rewrite yet</h3>
                  <p>Your transformed copy will appear here once you run the rewrite tool.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="card insight-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Insights</p>
              <h2>Usage and billing at a glance</h2>
            </div>
            <button className="button-secondary" onClick={refreshBilling}>
              Refresh billing
            </button>
          </div>

          <div className="insight-grid">
            <article className="insight-card">
              <p className="eyebrow">Usage</p>
              <strong>{analytics?.totalGenerations ?? 0}</strong>
              <span>Total generations</span>
              <div className="mode-list">
                {analytics?.topModes.length ? (
                  analytics.topModes.map((entry) => (
                    <span className="mode-chip" key={entry.mode}>
                      {entry.mode} / {entry.count}
                    </span>
                  ))
                ) : (
                  <span className="muted">No usage patterns yet.</span>
                )}
              </div>
            </article>

            <article className="insight-card">
              <p className="eyebrow">Billing</p>
              <strong>{billing?.billing.plan ?? 'Professional'}</strong>
              <span>
                {billing?.billing.monthlyUsage ?? 0} of {billing?.billing.monthlyQuota ?? 2500} monthly
                generations used
              </span>
              <div className="progress">
                <div className="progress__bar" style={{ width: `${billingUsagePercentage}%` }} />
              </div>
              <small>
                Status: {billing?.billing.status ?? 'active'} / Provider: {billing?.billing.provider ?? 'stripe'}
              </small>
            </article>
          </div>
        </section>

        <section className="card history-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recent work</p>
              <h2>Saved generations</h2>
            </div>
            <div className="action-row action-row--tight">
              <button
                className="button-secondary"
                onClick={() => loadHistoryPage(Math.max(0, historyPage.offset - historyPage.limit))}
                disabled={historyPage.offset === 0}
              >
                Previous
              </button>
              <button
                className="button-secondary"
                onClick={() => loadHistoryPage(historyPage.offset + historyPage.limit)}
                disabled={!historyPage.hasMore}
              >
                Next
              </button>
            </div>
          </div>

          {historyPage.items.length ? (
            <div className="history-list">
              {historyPage.items.map((item) => (
                <article className="history-card" key={item.id}>
                  <div className="history-card__header">
                    <span className="pill">{item.mode}</span>
                    <small>{formatDateTime(item.createdAt)}</small>
                  </div>
                  <p>{item.scenario}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-panel empty-panel--compact">
              <h3>No saved generations yet</h3>
              <p>Once you generate copy, recent work will appear here with timestamps.</p>
            </div>
          )}
        </section>

        <section className="card workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>Access and team settings</h2>
            </div>
            <div className="action-row action-row--tight">
              <button className="button-secondary" onClick={createKey}>
                Issue API key
              </button>
              <button className="button-secondary" onClick={createOrg}>
                Create workspace
              </button>
            </div>
          </div>

          {latestIssuedKey ? (
            <div className="secret-callout">
              <div>
                <p className="eyebrow">One-time secret</p>
                <strong>{latestIssuedKey.secret}</strong>
                <span>{latestIssuedKey.prefix}... / copy now before you move on.</span>
              </div>
              <button
                className="button-secondary"
                onClick={() => copyText(latestIssuedKey.secret, 'API key')}
              >
                Copy secret
              </button>
            </div>
          ) : null}

          <div className="workspace-columns">
            <div className="workspace-group">
              <div className="workspace-group__header">
                <h3>API keys</h3>
                <small>{keys.length} active</small>
              </div>
              {keys.length ? (
                <div className="stack-list">
                  {keys.map((key) => (
                    <div className="stack-list__item" key={key.id}>
                      <div>
                        <strong>{key.prefix}...</strong>
                        <span>{formatDateTime(key.createdAt)}</span>
                      </div>
                      <button className="button-inline" onClick={() => revokeKey(key.id)}>
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel empty-panel--compact">
                  <p>No API keys issued yet.</p>
                </div>
              )}
            </div>

            <div className="workspace-group">
              <div className="workspace-group__header">
                <h3>Workspaces</h3>
                <small>{orgs.length} configured</small>
              </div>
              {orgs.length ? (
                <div className="stack-list">
                  {orgs.map((org) => (
                    <div className="stack-list__item" key={org.id}>
                      <div>
                        <strong>{org.name}</strong>
                        <span>/{org.slug}</span>
                      </div>
                      <small>{org.members.length} members</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-panel empty-panel--compact">
                  <p>No workspaces configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
