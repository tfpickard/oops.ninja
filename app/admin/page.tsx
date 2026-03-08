import Link from 'next/link';
import { getAdminMetrics } from '@/lib/store';
import { SiteShell } from '@/components/site-shell';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const metrics = getAdminMetrics();

  return (
    <SiteShell
      current="admin"
      eyebrow="Admin command center"
      title="Operational oversight with less noise."
      description="Track reliability, moderation posture, and organization-level access patterns in the same visual system as the studio."
      actions={
        <Link className="button-link" href="/dashboard">
          Return to studio
        </Link>
      }
    >
      <div className="panel-grid panel-grid--docs">
        <section className="card feature-card">
          <p className="eyebrow">System metrics</p>
          <h2>Current platform shape</h2>
          <ul className="metric-list">
            <li>Total users: {metrics.totalUsers}</li>
            <li>Total generations: {metrics.totalGenerations}</li>
            <li>Total API keys: {metrics.totalApiKeys}</li>
            <li>Active share links: {metrics.activeShares}</li>
            <li>Moderation events (24h): {metrics.moderationEvents24h}</li>
          </ul>
        </section>
        <section className="card feature-card">
          <p className="eyebrow">Moderation posture</p>
          <h2>Queue health is nominal</h2>
          <p>Evidence-sensitive scenarios continue routing to ownership-forward formats, with queue health remaining stable.</p>
          <small className="muted">Escalation policy remains active across all generation surfaces.</small>
        </section>
      </div>
    </SiteShell>
  );
}
