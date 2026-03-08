'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  accountabilityPostureOptions,
  audienceOptions,
  formalityOptions,
  getDefaultOpenAiGpt5ReasoningEffort,
  getDefaultOpenAiGpt5Verbosity,
  getSupportedOpenAiGpt5ReasoningEfforts,
  generationModes,
  isOpenAiGpt5Family,
  mediumOptions,
  openAiGpt5VerbosityOptions,
  toneOptions,
  variantKinds,
} from '@/lib/contracts';
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
type UtilityTab = 'rewrite' | 'history' | 'workspace' | 'insights';
type GenerationSnapshot = {
  request: GenerationRequest;
  response: GenerationOutput;
};

const utilityTabs: Array<{ key: UtilityTab; label: string; summary: string }> = [
  { key: 'rewrite', label: 'Rewrite', summary: 'Refine existing copy without leaving the workflow.' },
  { key: 'history', label: 'History', summary: 'Review recent generations and activity.' },
  { key: 'workspace', label: 'Workspace', summary: 'Keys, workspaces, and operational access.' },
  { key: 'insights', label: 'Insights', summary: 'Usage patterns and billing posture.' },
];
const llmDefaults = {
  provider: 'openai' as const,
  model: 'gpt-5.2',
  reasoningEffort: getDefaultOpenAiGpt5ReasoningEffort('gpt-5.2'),
  verbosity: getDefaultOpenAiGpt5Verbosity(),
};
const otherSelectValue = '__other__';

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

function resolveSelectValue(value: string, options: readonly string[]) {
  return options.includes(value) ? value : otherSelectValue;
}

function clampPercentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function cloneRequestPayload(request: GenerationRequest): GenerationRequest {
  return {
    ...request,
    llm: {
      ...request.llm,
    },
  };
}

function formatProvider(provider: GenerationRequest['llm']['provider']) {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    case 'openrouter':
      return 'OpenRouter';
    default:
      return provider;
  }
}

export function GeneratorClient() {
  const [form, setForm] = useState<GenerationRequest>(defaults);
  const [audienceSelection, setAudienceSelection] = useState<string>(
    resolveSelectValue(defaults.audience, audienceOptions),
  );
  const [mediumSelection, setMediumSelection] = useState<string>(
    resolveSelectValue(defaults.medium, mediumOptions),
  );
  const [rewrite, setRewrite] = useState<RewriteRequest>(rewriteDefaults);
  const [generated, setGenerated] = useState<GenerationOutput | null>(null);
  const [generationSnapshot, setGenerationSnapshot] = useState<GenerationSnapshot | null>(null);
  const [selectedVariantKind, setSelectedVariantKind] = useState<string>('');
  const [activeUtilityTab, setActiveUtilityTab] = useState<UtilityTab>('rewrite');
  const [rewriteOutput, setRewriteOutput] = useState<string>('');
  const [historyPage, setHistoryPage] = useState<GenerationPage>({
    items: [],
    total: 0,
    limit: 5,
    offset: 0,
    hasMore: false,
  });
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
  const selectedVariant = useMemo(() => {
    if (!generated) return null;
    return generated.variants.find((variant) => variant.kind === selectedVariantKind) ?? generated.variants[0] ?? null;
  }, [generated, selectedVariantKind]);
  const selectedUtilitySummary =
    utilityTabs.find((tab) => tab.key === activeUtilityTab)?.summary ?? utilityTabs[0].summary;
  const isAudienceCustom = audienceSelection === otherSelectValue;
  const isMediumCustom = mediumSelection === otherSelectValue;
  const supportsGpt5Controls = isOpenAiGpt5Family(form.llm.provider, form.llm.model);
  const supportedReasoningEfforts = getSupportedOpenAiGpt5ReasoningEfforts(form.llm.model);
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
  const requestJson = generationSnapshot ? JSON.stringify(generationSnapshot.request, null, 2) : '';
  const responseJson = generationSnapshot ? JSON.stringify(generationSnapshot.response, null, 2) : '';

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

  useEffect(() => {
    setForm((current) => {
      const nextLlm = { ...current.llm };

      if (!isOpenAiGpt5Family(current.llm.provider, current.llm.model)) {
        if (nextLlm.reasoningEffort === undefined && nextLlm.verbosity === undefined) {
          return current;
        }

        nextLlm.reasoningEffort = undefined;
        nextLlm.verbosity = undefined;
        return { ...current, llm: nextLlm };
      }

      const nextReasoningEffort =
        current.llm.reasoningEffort &&
        getSupportedOpenAiGpt5ReasoningEfforts(current.llm.model).includes(current.llm.reasoningEffort)
          ? current.llm.reasoningEffort
          : getDefaultOpenAiGpt5ReasoningEffort(current.llm.model);
      const nextVerbosity = current.llm.verbosity ?? getDefaultOpenAiGpt5Verbosity();

      if (nextLlm.reasoningEffort === nextReasoningEffort && nextLlm.verbosity === nextVerbosity) {
        return current;
      }

      nextLlm.reasoningEffort = nextReasoningEffort;
      nextLlm.verbosity = nextVerbosity;
      return { ...current, llm: nextLlm };
    });
  }, [form.llm.model, form.llm.provider]);

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
      const requestPayload = cloneRequestPayload(form);
      const data = await fetchJson<GenerationOutput>('/api/v1/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
      setGenerated(data.data);
      setGenerationSnapshot({ request: requestPayload, response: data.data });
      setSelectedVariantKind(data.data.variants[0]?.kind ?? '');
      setShareMeta(null);
      setMessage(`${variantKinds.length} variants generated and saved to your history.`);
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
      setActiveUtilityTab('rewrite');
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
      setActiveUtilityTab('workspace');
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
      setActiveUtilityTab('workspace');
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
      setActiveUtilityTab('insights');
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
      setActiveUtilityTab('history');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="dashboard-stack">
      <section className="console-ribbon" aria-label="Studio summary">
        <article className="console-ribbon__item">
          <span>Provider</span>
          <strong>{formatProvider(form.llm.provider)}</strong>
          <small>{form.llm.model}</small>
        </article>
        <article className="console-ribbon__item">
          <span>Voice profile</span>
          <strong>{obnoxiousnessLabel}</strong>
          <small>{sycophancyLabel} and audience-aware</small>
        </article>
        <article className="console-ribbon__item">
          <span>Generations</span>
          <strong>{usage}</strong>
          <small>{analytics?.topModes[0]?.mode ?? 'No dominant mode yet'}</small>
        </article>
        <article className="console-ribbon__item">
          <span>Last activity</span>
          <strong>{formatDateTime(analytics?.lastGenerationAt ?? null)}</strong>
          <small>
            {orgs.length} workspace{orgs.length === 1 ? '' : 's'}
          </small>
        </article>
      </section>

      <div className="workflow-grid">
        <section className={`card studio-panel studio-panel--refined${isWorking ? ' studio-panel--working' : ''}`}>
          <div className="section-heading section-heading--split-column">
            <div>
              <p className="eyebrow">Compose</p>
              <h2>Shape the response</h2>
              <p className="section-copy">
                Start with the event, set the accountability posture, then fine-tune how human or polished
                the language should feel.
              </p>
            </div>
            <div className="provider-pill provider-pill--stacked">
              <span>Current model</span>
              <strong>{form.llm.model}</strong>
              <small>{formatProvider(form.llm.provider)}</small>
            </div>
          </div>

          <label className="field field--scenario">
            <span className="field__label">Situation</span>
            <span className="field__hint">
              Describe the miss, the audience pressure, and what the response needs to accomplish.
            </span>
            <textarea
              value={form.scenario}
              onChange={(e) => setForm({ ...form, scenario: e.target.value })}
            />
          </label>

          <section className="compose-section">
            <div className="compose-section__header">
              <div>
                <p className="eyebrow">Intent</p>
                <h3>Choose the posture before the polish.</h3>
              </div>
              <p className="muted">Keep the main response mode and accountability level visible.</p>
            </div>

            <div className="control-grid control-grid--2">
              <label className="field">
                <span className="field__label">Mode</span>
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
              <label className="field">
                <span className="field__label">Accountability posture</span>
                <select
                  value={form.accountabilityPosture}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      accountabilityPosture: e.target.value as GenerationRequest['accountabilityPosture'],
                    })
                  }
                >
                  {accountabilityPostureOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="compose-section">
            <div className="compose-section__header">
              <div>
                <p className="eyebrow">Voice</p>
                <h3>Set the executive register.</h3>
              </div>
              <p className="muted">These are the visible defaults you will keep revisiting.</p>
            </div>

            <div className="control-grid control-grid--2">
              <label className="field">
                <span className="field__label">Tone</span>
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
              <label className="field">
                <span className="field__label">Formality</span>
                <select
                  value={form.formality}
                  onChange={(e) =>
                    setForm({ ...form, formality: e.target.value as GenerationRequest['formality'] })
                  }
                >
                  {formalityOptions.map((formality) => (
                    <option key={formality} value={formality}>
                      {formality}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="compose-section">
            <div className="compose-section__header">
              <div>
                <p className="eyebrow">Delivery</p>
                <h3>Anchor the audience and format.</h3>
              </div>
              <p className="muted">These keep the variants grounded in the real message you need to send.</p>
            </div>

            <div className="control-grid control-grid--2">
              <label className="field">
                <span className="field__label">Audience</span>
                <span className="field__hint">Choose a target reader or use custom.</span>
                <select
                  value={audienceSelection}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAudienceSelection(value);
                    setForm({ ...form, audience: value === otherSelectValue ? '' : value });
                  }}
                >
                  {audienceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={otherSelectValue}>Other (custom)</option>
                </select>
                {isAudienceCustom ? (
                  <input
                    placeholder="Enter a custom audience"
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  />
                ) : null}
              </label>
              <label className="field">
                <span className="field__label">Medium</span>
                <span className="field__hint">Pick the delivery channel or type your own.</span>
                <select
                  value={mediumSelection}
                  onChange={(e) => {
                    const value = e.target.value;
                    setMediumSelection(value);
                    setForm({ ...form, medium: value === otherSelectValue ? '' : value });
                  }}
                >
                  {mediumOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={otherSelectValue}>Other (custom)</option>
                </select>
                {isMediumCustom ? (
                  <input
                    placeholder="Enter a custom medium"
                    value={form.medium}
                    onChange={(e) => setForm({ ...form, medium: e.target.value })}
                  />
                ) : null}
              </label>
            </div>
          </section>

          <details className="advanced-panel">
            <summary>
              <span>Advanced voice and model controls</span>
              <small>Fine tune edge, deference, and provider settings.</small>
            </summary>
            <div className="advanced-panel__body">
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
                      <span className="dial-card__label">Syrupy deference</span>
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

              <div className="control-grid control-grid--2">
                <label className="field">
                  <span className="field__label">Provider</span>
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
                <label className="field">
                  <span className="field__label">Model</span>
                  <input
                    value={form.llm.model}
                    onChange={(e) => setForm({ ...form, llm: { ...form.llm, model: e.target.value } })}
                  />
                </label>
              </div>

              {supportsGpt5Controls ? (
                <div className="control-grid control-grid--2">
                  <label className="field">
                    <span className="field__label">Reasoning effort</span>
                    <span className="field__hint">OpenAI GPT-5 Responses control from the official docs.</span>
                    <select
                      value={form.llm.reasoningEffort ?? getDefaultOpenAiGpt5ReasoningEffort(form.llm.model)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          llm: {
                            ...form.llm,
                            reasoningEffort: e.target.value as NonNullable<GenerationRequest['llm']['reasoningEffort']>,
                          },
                        })
                      }
                    >
                      {supportedReasoningEfforts.map((effort) => (
                        <option key={effort} value={effort}>
                          {effort}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="field__label">Verbosity</span>
                    <span className="field__hint">OpenAI GPT-5 Responses text verbosity.</span>
                    <select
                      value={form.llm.verbosity ?? getDefaultOpenAiGpt5Verbosity()}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          llm: {
                            ...form.llm,
                            verbosity: e.target.value as NonNullable<GenerationRequest['llm']['verbosity']>,
                          },
                        })
                      }
                    >
                      {openAiGpt5VerbosityOptions.map((verbosity) => (
                        <option key={verbosity} value={verbosity}>
                          {verbosity}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </details>

          <div className="action-row">
            <button type="button" className={isWorking ? 'button-working' : ''} onClick={generate} disabled={isWorking}>
              {isWorking ? 'Generating deck...' : 'Generate variants'}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                setForm(defaults);
                setAudienceSelection(resolveSelectValue(defaults.audience, audienceOptions));
                setMediumSelection(resolveSelectValue(defaults.medium, mediumOptions));
              }}
              disabled={isWorking}
            >
              Reset settings
            </button>
          </div>

          <div className={`status-banner${error ? ' status-banner--error' : ''}${isWorking ? ' status-banner--working' : ''}`}>
            <p className="eyebrow">{error ? 'Issue' : isWorking ? 'Working' : 'Studio status'}</p>
            <strong>{error ? error : message}</strong>
            {isWorking && !error ? (
              <div className="corporate-loader" role="status" aria-live="polite" aria-label="Generation in progress">
                <span className="corporate-loader__dot" />
                <span className="corporate-loader__label">Aligning stakeholder narratives...</span>
                <span className="corporate-loader__bars" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            ) : null}
          </div>
        </section>

        <section className={`card results-panel results-panel--refined${isWorking ? ' results-panel--working' : ''}`}>
          <div className="section-heading section-heading--split-column">
            <div>
              <p className="eyebrow">Output deck</p>
              <h2>Review one polished variant at a time</h2>
              <p className="section-copy">
                Compare variants through a selected-reader view instead of scanning a wall of equally loud cards.
              </p>
            </div>
            <div className="results-panel__meta">
              <span>{generated?.variants.length ?? 0} variants</span>
              <small>{generated ? 'Ready to compare and copy.' : 'Waiting for a run.'}</small>
            </div>
          </div>

          {generated && selectedVariant ? (
            <div className="results-stage">
              <div className="variant-rail" aria-label="Generated variants">
                {generated.variants.map((variant) => (
                  <button
                    key={variant.kind}
                    type="button"
                    className={`variant-chip${selectedVariant.kind === variant.kind ? ' variant-chip--active' : ''}`}
                    onClick={() => setSelectedVariantKind(variant.kind)}
                  >
                    {variant.kind}
                  </button>
                ))}
              </div>

              <article className="result-focus">
                <div className="result-focus__header">
                  <div>
                    <p className="eyebrow">Selected variant</p>
                    <h3>{selectedVariant.kind}</h3>
                  </div>
                  <div className="action-row action-row--tight">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => copyText(selectedVariant.text, selectedVariant.kind)}
                    >
                      Copy variant
                    </button>
                    <button type="button" className="button-secondary" onClick={shareLatest} disabled={!canShare}>
                      Create share link
                    </button>
                  </div>
                </div>

                <p className="result-focus__text">{selectedVariant.text}</p>

                <div className="result-focus__footer">
                  <div className="result-focus__stat">
                    <span>Most-used mode</span>
                    <strong>{analytics?.topModes[0]?.mode ?? 'No dominant mode yet'}</strong>
                  </div>
                  <div className="result-focus__stat">
                    <span>Latest activity</span>
                    <strong>{formatDateTime(analytics?.lastGenerationAt ?? null)}</strong>
                  </div>
                </div>
              </article>

              {shareMeta ? (
                <div className="share-strip share-strip--compact">
                  <div>
                    <p className="eyebrow">Latest share</p>
                    <strong>{shareMeta.url}</strong>
                    <span>Expires {formatDateTime(shareMeta.expiresAt)}</span>
                  </div>
                  <button type="button" className="button-secondary" onClick={() => copyText(shareMeta.url, 'Share link')}>
                    Copy link
                  </button>
                </div>
              ) : null}

              <details className="diagnostics-panel">
                <summary>
                  <span>Technical details</span>
                  <small>Request JSON and response JSON for this run.</small>
                </summary>
                <div className="diagnostics-grid">
                  <article className="diagnostics-card">
                    <p className="eyebrow">Request JSON</p>
                    <pre className="code-block">
                      <code>{requestJson}</code>
                    </pre>
                  </article>
                  <article className="diagnostics-card">
                    <p className="eyebrow">Response JSON</p>
                    <pre className="code-block">
                      <code>{responseJson}</code>
                    </pre>
                  </article>
                </div>
              </details>
            </div>
          ) : (
            <div className="empty-panel empty-panel--hero">
              <div className="empty-panel__media" aria-hidden="true">
                <Image src="/generated/empty-deck.svg" alt="" width={320} height={220} />
              </div>
              <div className="empty-panel__copy">
                <p className="eyebrow">No generation yet</p>
                <h3>Run the studio once and the response deck will land here.</h3>
                <p>
                  The primary view now focuses on one readable result at a time. Raw JSON stays available,
                  but hidden behind technical details when you need it.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="card utility-dock">
        <div className="utility-dock__header">
          <div>
            <p className="eyebrow">Utility dock</p>
            <h2>Secondary tools, kept nearby</h2>
          </div>
          <p className="muted">{selectedUtilitySummary}</p>
        </div>

        <div className="utility-tabs" aria-label="Utility sections">
          {utilityTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`utility-tab${activeUtilityTab === tab.key ? ' utility-tab--active' : ''}`}
              onClick={() => setActiveUtilityTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="utility-panel">
          {activeUtilityTab === 'rewrite' ? (
            <div className="utility-panel__layout utility-panel__layout--rewrite">
              <div className="rewrite-controls">
                <label className="field">
                  <span className="field__label">Input</span>
                  <textarea
                    value={rewrite.text}
                    onChange={(e) => setRewrite({ ...rewrite, text: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span className="field__label">Transform</span>
                  <input
                    value={rewrite.transform}
                    onChange={(e) => setRewrite({ ...rewrite, transform: e.target.value })}
                  />
                </label>
                <button type="button" className={isWorking ? 'button-working' : ''} onClick={runRewrite} disabled={isWorking}>
                  {isWorking ? 'Rewriting...' : 'Rewrite text'}
                </button>
              </div>

              <div className="rewrite-preview">
                <p className="eyebrow">Preview</p>
                {rewriteOutput ? (
                  <>
                    <p className="rewrite-preview__text">{rewriteOutput}</p>
                    <button
                      type="button"
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
          ) : null}

          {activeUtilityTab === 'history' ? (
            <div className="utility-panel__stack">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Recent work</p>
                  <h3>Saved generations</h3>
                </div>
                <div className="action-row action-row--tight">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => loadHistoryPage(Math.max(0, historyPage.offset - historyPage.limit))}
                    disabled={historyPage.offset === 0}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
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
            </div>
          ) : null}

          {activeUtilityTab === 'workspace' ? (
            <div className="utility-panel__stack">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Workspace</p>
                  <h3>Keys and team settings</h3>
                </div>
                <div className="action-row action-row--tight">
                  <button type="button" className="button-secondary" onClick={createKey}>
                    Issue API key
                  </button>
                  <button type="button" className="button-secondary" onClick={createOrg}>
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
                    type="button"
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
                          <button type="button" className="button-inline" onClick={() => revokeKey(key.id)}>
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
            </div>
          ) : null}

          {activeUtilityTab === 'insights' ? (
            <div className="utility-panel__stack">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Insights</p>
                  <h3>Usage and billing at a glance</h3>
                </div>
                <button type="button" className="button-secondary" onClick={refreshBilling}>
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
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
