'use client';

import { useEffect, useMemo, useState } from 'react';
import { generationModes } from '@/lib/contracts';
import type { GenerationRequest, RewriteRequest } from '@/lib/contracts';

type ApiKeyEntry = { id: string; prefix: string; createdAt: string };
type GenerationEntry = { id: string; scenario: string; mode: string; createdAt: string };
type OrgEntry = { id: string; name: string; slug: string; members: string[] };

type GenerationPage = {
  items: GenerationEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

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
  llm: llmDefaults,
};

export function GeneratorClient() {
  const [form, setForm] = useState<GenerationRequest>(defaults);
  const [result, setResult] = useState<string>('No generation executed yet.');
  const [rewrite, setRewrite] = useState<RewriteRequest>({
    text: 'We had a miss in coordination and I own the breakdown.',
    transform: 'Make this more concise',
    llm: llmDefaults,
  });
  const [historyPage, setHistoryPage] = useState<GenerationPage>({ items: [], total: 0, limit: 5, offset: 0, hasMore: false });
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [orgs, setOrgs] = useState<OrgEntry[]>([]);
  const [usage, setUsage] = useState<number>(0);
  const [analytics, setAnalytics] = useState<string>('No analytics sampled yet.');
  const [billing, setBilling] = useState<string>('Billing snapshot not queried yet.');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [message, setMessage] = useState<string>('Ready.');
  const [error, setError] = useState<string>('');
  const [isWorking, setIsWorking] = useState(false);

  const canShare = useMemo(() => historyPage.items.length > 0, [historyPage.items.length]);

  async function fetchJson(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message ?? 'Request failed');
    }
    return data;
  }

  async function refreshData(offset = 0) {
    const [historyData, keysData, usageData, orgData, analyticsData] = await Promise.all([
      fetchJson(`/api/v1/generations?limit=${historyPage.limit}&offset=${offset}`),
      fetchJson('/api/v1/api-keys'),
      fetchJson('/api/v1/usage'),
      fetchJson('/api/v1/organizations'),
      fetchJson('/api/v1/analytics/summary'),
    ]);

    setHistoryPage(historyData.data);
    setKeys(keysData.data.items ?? []);
    setUsage(usageData.data.totalGenerations ?? 0);
    setOrgs(orgData.data.items ?? []);
    setAnalytics(JSON.stringify(analyticsData.data.summary ?? {}, null, 2));
  }

  useEffect(() => {
    refreshData().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validateLlmConfig() {
    if (!form.llm.model.trim()) {
      setError('Model is required to use the configured LLM provider.');
      return false;
    }

    setError('');
    return true;
  }

  async function generate() {
    if (!validateLlmConfig()) return;

    setIsWorking(true);
    setError('');
    try {
      const data = await fetchJson('/api/v1/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      setResult(JSON.stringify(data, null, 2));
      setMessage('Generation variants produced successfully.');
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
      const data = await fetchJson('/api/v1/rewrite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...rewrite, llm: form.llm }),
      });
      setResult(JSON.stringify(data, null, 2));
      setMessage('Rewrite transformation completed.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsWorking(false);
    }
  }

  async function createKey() {
    setError('');
    try {
      await fetchJson('/api/v1/api-keys', { method: 'POST' });
      await refreshData(historyPage.offset);
      setMessage('API key issued.');
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
        body: JSON.stringify({ name: `Narrative Ops ${orgs.length + 1}` }),
      });
      await refreshData(historyPage.offset);
      setMessage('Organization created.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function loadBilling() {
    setError('');
    try {
      const data = await fetchJson('/api/v1/billing/portal');
      setBilling(JSON.stringify(data.data, null, 2));
      setMessage('Billing profile loaded.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function shareLatest() {
    if (!historyPage.items[0]) return;
    setError('');
    try {
      const data = await fetchJson(`/api/v1/generations/${historyPage.items[0].id}/share`, { method: 'POST' });
      setShareUrl(data.data.share?.url ?? 'Unable to create share link.');
      setMessage('Share link created.');
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
      <section className="trust-strip card">
        <div>
          <p className="trust-strip__label">Workspace health</p>
          <strong>{isWorking ? 'Processing request…' : 'Platform operational'}</strong>
        </div>
        <div>
          <p className="trust-strip__label">Total generations</p>
          <strong>{usage}</strong>
        </div>
        <div>
          <p className="trust-strip__label">Provisioned workspaces</p>
          <strong>{orgs.length}</strong>
        </div>
      </section>

      <section className="card llm-config">
        <div>
          <h2>Model Provider</h2>
          <p className="muted">Choose the provider and model. Provider credentials are loaded from the server environment.</p>
        </div>
        <div className="grid grid-2">
          <label>
            Provider
            <select
              value={form.llm.provider}
              onChange={(e) => setForm({ ...form, llm: { ...form.llm, provider: e.target.value as GenerationRequest['llm']['provider'] } })}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </label>
          <label>
            Model
            <input value={form.llm.model} onChange={(e) => setForm({ ...form, llm: { ...form.llm, model: e.target.value } })} />
          </label>
        </div>
      </section>

      <div className="grid grid-2">
        <section className="card grid card--accent lift-on-hover">
          <h2>Generation Control Surface</h2>
          <label>Scenario<textarea value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} /></label>
          <div className="grid grid-2">
            <label>Mode<select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as GenerationRequest['mode'] })}>{generationModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label>
            <label>Tone<select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value as GenerationRequest['tone'] })}><option>empathetic</option><option>neutral</option><option>professional</option><option>authoritative</option></select></label>
          </div>
          <button onClick={generate} disabled={isWorking}>{isWorking ? 'Processing…' : 'Generate Variants'}</button>
        </section>

        <section className="card grid lift-on-hover">
          <h2>Rewrite Utility</h2>
          <label>Input<textarea value={rewrite.text} onChange={(e) => setRewrite({ ...rewrite, text: e.target.value })} /></label>
          <label>Transform<input value={rewrite.transform} onChange={(e) => setRewrite({ ...rewrite, transform: e.target.value })} /></label>
          <button onClick={runRewrite} disabled={isWorking}>{isWorking ? 'Processing…' : 'Rewrite Text'}</button>
        </section>

        <section className="card grid lift-on-hover">
          <h2>Phase 1 Readiness</h2>
          <small>Total generations: {usage}</small>
          <button onClick={createKey}>Issue API key</button>
          <ul>
            {keys.length === 0 && <li className="empty-state"><small>No API keys provisioned.</small></li>}
            {keys.map((key) => (
              <li key={key.id}>
                <code>{key.prefix}••••</code> <small>{new Date(key.createdAt).toLocaleString()}</small>
                <button className="inline-button" onClick={() => revokeKey(key.id)}>Revoke</button>
              </li>
            ))}
          </ul>
          <h3>Saved history</h3>
          <ul>
            {historyPage.items.length === 0 && <li className="empty-state"><small>No saved generations yet.</small></li>}
            {historyPage.items.map((item) => <li key={item.id}>{item.mode}: {item.scenario.slice(0, 72)}</li>)}
          </ul>
          <div className="grid grid-2">
            <button onClick={() => loadHistoryPage(Math.max(0, historyPage.offset - historyPage.limit))} disabled={historyPage.offset === 0}>Previous</button>
            <button onClick={() => loadHistoryPage(historyPage.offset + historyPage.limit)} disabled={!historyPage.hasMore}>Next</button>
          </div>
        </section>

        <section className="card grid lift-on-hover">
          <h2>Phase 2 Workspace</h2>
          <button onClick={createOrg}>Create organization</button>
          <ul>
            {orgs.length === 0 && <li className="empty-state"><small>No organizations configured.</small></li>}
            {orgs.map((org) => <li key={org.id}><strong>{org.name}</strong> <small>/{org.slug} · {org.members.length} members</small></li>)}
          </ul>
          <button onClick={loadBilling}>Load billing profile</button>
          <button onClick={shareLatest} disabled={!canShare}>Share latest generation</button>
          {shareUrl && <small>Share endpoint: {shareUrl}</small>}
        </section>
      </div>

      <section className="card">
        <h2>Status</h2>
        <small>{message}</small>
        {isWorking && <p className="working-dot" aria-live="polite">Working…</p>}
        {error && <p role="alert" className="alert">{error}</p>}
      </section>

      <section className="card">
        <h2>Analytics Snapshot</h2>
        <pre>{analytics}</pre>
      </section>

      <section className="card">
        <h2>Billing Snapshot</h2>
        <pre>{billing}</pre>
      </section>

      <section className="card">
        <h2>API Result</h2>
        <pre>{result}</pre>
      </section>
    </div>
  );
}
