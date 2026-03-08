import Link from 'next/link';
import { typescriptSdkSnippet } from '@/lib/sdk';
import { SiteShell } from '@/components/site-shell';

export default function SdkPage() {
  return (
    <SiteShell
      current="sdk"
      eyebrow="SDK resources"
      title="Typed integration scaffolds."
      description="Keep the SDK close to the docs and close to the product, with code surfaces that feel like part of the same system."
      actions={
        <Link className="button-link" href="/docs">
          Back to docs
        </Link>
      }
    >
      <div className="panel-grid panel-grid--docs">
        <section className="card feature-card">
          <p className="eyebrow">TypeScript SDK</p>
          <h2>Client scaffold</h2>
          <pre className="code-block">
            <code>{typescriptSdkSnippet}</code>
          </pre>
        </section>
        <section className="card feature-card">
          <p className="eyebrow">Workflow</p>
          <h2>Use it like the UI does</h2>
          <p>Generate variants, rewrite existing copy, and keep request structures aligned with the same product contracts.</p>
          <Link className="button-inline" href="/dashboard">
            Open the studio
          </Link>
        </section>
      </div>
    </SiteShell>
  );
}
