'use client';

import { SiteShell } from '@/components/site-shell';

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <SiteShell
      current="dashboard"
      eyebrow="Narrative Studio"
      title="The studio hit an unexpected fault."
      description="The operations console could not finish initialization. Retry the session and the shared shell will stay in place."
    >
      <section className="card status-card">
        <p className="eyebrow">Temporary issue</p>
        <h2>Console temporarily unavailable</h2>
        <p>The operations console encountered an unexpected failure. Please retry initialization.</p>
        <button onClick={reset}>Retry</button>
      </section>
    </SiteShell>
  );
}
