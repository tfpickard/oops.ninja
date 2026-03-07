'use client';

import { useState } from 'react';
import type { GenerationRequest, RewriteRequest } from '@/lib/contracts';

const defaults: GenerationRequest = {
  scenario: 'I missed an investor update call.',
  mode: 'Professional apology',
  tone: 'professional',
  formality: 'executive',
  accountabilityPosture: 'calibrated ownership',
  audience: 'investor',
  medium: 'email',
};

export function GeneratorClient() {
  const [form, setForm] = useState<GenerationRequest>(defaults);
  const [result, setResult] = useState<string>('');
  const [rewrite, setRewrite] = useState<RewriteRequest>({
    text: 'We had a miss in coordination and I own the breakdown.',
    transform: 'Make this more concise',
  });

  async function generate() {
    const res = await fetch('/api/v1/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  }

  async function runRewrite() {
    const res = await fetch('/api/v1/rewrite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rewrite),
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  }

  return (
    <div className="grid grid-2">
      <section className="card grid">
        <h2>Generate Response Variants</h2>
        <label>Scenario<textarea value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} /></label>
        <label>Mode<input value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} /></label>
        <label>Tone<select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value as GenerationRequest['tone'] })}><option>empathetic</option><option>neutral</option><option>professional</option><option>authoritative</option></select></label>
        <button onClick={generate}>Generate</button>
      </section>
      <section className="card grid">
        <h2>Rewrite Utility</h2>
        <label>Input<textarea value={rewrite.text} onChange={(e) => setRewrite({ ...rewrite, text: e.target.value })} /></label>
        <label>Transform<input value={rewrite.transform} onChange={(e) => setRewrite({ ...rewrite, transform: e.target.value })} /></label>
        <button onClick={runRewrite}>Rewrite</button>
      </section>
      <section className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Result</h2>
        <pre>{result || 'No generation executed yet.'}</pre>
      </section>
    </div>
  );
}
