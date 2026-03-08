import Link from 'next/link';
import { GeneratorClient } from '@/components/generator-client';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <main className="page-shell">
      <section className="hero hero--console card">
        <div className="hero__content">
          <div className="hero__badge-row">
            <div className="logo-mark" aria-hidden="true">ON</div>
            <div className="hero__eyebrow">Narrative Studio</div>
          </div>
          <h1>Write the version of events you actually want to send.</h1>
          <p>
            Shape the tone, tune the theatrics, and turn rough incident notes into polished responses that
            feel deliberate instead of improvised.
          </p>
          <div className="hero__links">
            <Link className="button-link" href="/docs">Explore the API</Link>
            <Link className="button-link button-link--ghost" href="/sdk">Review the SDK</Link>
          </div>
        </div>
        <div className="hero__preview">
          <div className="hero__preview-card">
            <p className="eyebrow">Positioning</p>
            <h2>Calibrated narrative control with enough personality to feel human.</h2>
            <p>
              Push a response toward blunt, polished, diplomatic, or gloriously overcooked without dropping
              into raw prompt engineering.
            </p>
          </div>
          <div className="hero__mini-grid">
            <div className="hero__mini-card">
              <span>Studio</span>
              <strong>Provider-aware</strong>
            </div>
            <div className="hero__mini-card">
              <span>Outputs</span>
              <strong>Structured variants</strong>
            </div>
            <div className="hero__mini-card">
              <span>Guardrails</span>
              <strong>Policy-checked</strong>
            </div>
            <div className="hero__mini-card">
              <span>Sharing</span>
              <strong>Link-ready</strong>
            </div>
          </div>
        </div>
      </section>
      <GeneratorClient />
    </main>
  );
}
