import { SiteShell } from '@/components/site-shell';

export default function DashboardLoading() {
  return (
    <SiteShell
      current="dashboard"
      eyebrow="Narrative Studio"
      title="Loading the studio."
      description="Retrieving user context, usage, and workspace controls."
    >
      <section className="card status-card">
        <p className="eyebrow">Loading</p>
        <h2>Preparing the composition surface</h2>
        <p>The workflow, results deck, and utility tools will appear once the studio finishes initialization.</p>
      </section>
    </SiteShell>
  );
}
