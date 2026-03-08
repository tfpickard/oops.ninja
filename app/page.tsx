import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>oops.ninja</h1>
      <p>Operational language for high-variance human events.</p>
      <div className="grid grid-2">
        <section className="card">
          <h2>Incident Response Language Engine</h2>
          <p>Deploy calibrated accountability responses across executive, internal, and public channels.</p>
          <Link href="/dashboard">Open Operations Console</Link>
        </section>
        <section className="card">
          <h2>Policy and Platform Integrity</h2>
          <p>High-risk externalization requests are restricted. Evidence-sensitive incidents route to accountability-forward outputs.</p>
          <Link href="/docs">Review Documentation</Link>
        </section>
        <section className="card">
          <h2>Developer Platform</h2>
          <p>Integrate generation controls via REST endpoints, API keys, and TypeScript SDK scaffolds.</p>
          <Link href="/api/v1/openapi.json">Inspect OpenAPI Contract</Link>
        </section>
        <section className="card">
          <h2>Operations and Governance</h2>
          <p>Track usage, supervise moderation posture, and manage organization-level access patterns.</p>
          <Link href="/admin">Open Admin Command Center</Link>
        </section>
      </div>
    </main>
  );
}
