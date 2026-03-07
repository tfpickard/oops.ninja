import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>oops.ninja</h1>
      <p>Precision messaging when incidents happen.</p>
      <div className="grid grid-2">
        <section className="card">
          <h2>Operational Language Engine</h2>
          <p>Deploy calibrated accountability responses across email, Slack, SMS, and executive channels.</p>
          <Link href="/dashboard">Open Alpha Dashboard</Link>
        </section>
        <section className="card">
          <h2>Platform Safety Policy</h2>
          <p>High-risk externalization requests are restricted. Evidence-sensitive scenarios are routed to accountability-forward formats.</p>
          <Link href="/api/v1/openapi.json">Inspect API Contract</Link>
        </section>
      </div>
    </main>
  );
}
