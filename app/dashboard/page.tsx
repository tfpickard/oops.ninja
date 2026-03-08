import Link from 'next/link';
import { GeneratorClient } from '@/components/generator-client';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <main className="page-shell">
      <section className="hero card">
        <div className="hero__badge-row">
          <div className="logo-mark" aria-hidden="true">ON</div>
          <div className="hero__eyebrow">Narrative Operations Platform</div>
        </div>
        <h1>Operations Console</h1>
        <p>
          Generate controlled narrative responses, monitor usage, and coordinate workspace controls in one
          premium command center.
        </p>
        <div className="hero__links">
          <Link href="/admin">Open Admin Command Center</Link>
          <span aria-hidden="true">·</span>
          <Link href="/docs">View API &amp; SDK documentation</Link>
        </div>
      </section>
      <GeneratorClient />
    </main>
  );
}
