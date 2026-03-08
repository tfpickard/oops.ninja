import Link from 'next/link';
import { getAdminMetrics } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const metrics = getAdminMetrics();

  return (
    <main>
      <h1>Admin Command Center</h1>
      <p>Operational supervision for platform reliability, moderation posture, and growth analytics.</p>
      <div className="grid grid-2">
        <section className="card">
          <h2>System Metrics</h2>
          <ul>
            <li>Total users: {metrics.totalUsers}</li>
            <li>Total generations: {metrics.totalGenerations}</li>
            <li>Total API keys: {metrics.totalApiKeys}</li>
            <li>Active share links: {metrics.activeShares}</li>
            <li>Moderation events (24h): {metrics.moderationEvents24h}</li>
          </ul>
        </section>
        <section className="card">
          <h2>Moderation Review</h2>
          <p>Queue health: nominal.</p>
          <small>Escalation policy routes evidence-sensitive scenarios to ownership-forward formats.</small>
        </section>
      </div>
      <p><Link href="/dashboard">Return to Operations Console</Link></p>
    </main>
  );
}
