import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';

const endpoints = [
  'POST /api/v1/generate',
  'POST /api/v1/rewrite',
  'GET /api/v1/templates',
  'GET /api/v1/presets',
  'GET /api/v1/me',
  'GET /api/v1/usage',
  'GET /api/v1/generations',
  'POST /api/v1/api-keys',
  'DELETE /api/v1/api-keys/{id}',
  'GET /api/v1/health',
  'GET /api/v1/openapi.json',
  'GET /api/v1/admin/overview',
  'GET/POST /api/v1/organizations',
  'GET /api/v1/analytics/summary',
  'GET /api/v1/billing/portal',
  'POST /api/v1/generations/{id}/share',
  'GET /api/v1/shares/{token}',
  'GET /api/v1/sdk/typescript',
];

export default function DocsPage() {
  return (
    <SiteShell
      current="docs"
      eyebrow="Platform documentation"
      title="Contracts that stay close to the product."
      description="Reference the production-facing API, operational endpoints, and integration pathways without leaving the shared shell."
      actions={
        <>
          <Link className="button-link" href="/api/v1/openapi.json">
            Open OpenAPI JSON
          </Link>
          <Link className="button-link button-link--ghost" href="/sdk">
            View SDK resources
          </Link>
        </>
      }
    >
      <div className="panel-grid panel-grid--docs">
        <section className="card feature-card">
          <p className="eyebrow">REST endpoints</p>
          <h2>Operational surface area</h2>
          <ul className="endpoint-list">
            {endpoints.map((endpoint) => (
              <li key={endpoint}>
                <code>{endpoint}</code>
              </li>
            ))}
          </ul>
        </section>
        <section className="card feature-card">
          <p className="eyebrow">SDK</p>
          <h2>Typed client resources</h2>
          <p>TypeScript client scaffolds and standards-aligned request shapes live in the SDK section.</p>
          <Link className="button-inline" href="/sdk">
            Open SDK resources
          </Link>
        </section>
      </div>
    </SiteShell>
  );
}
