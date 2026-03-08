import Link from 'next/link';

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
    <main>
      <h1>Platform Documentation</h1>
      <p>Reference the production-facing API contract and integration pathways for automation teams.</p>
      <section className="card">
        <h2>REST Endpoints</h2>
        <ul>{endpoints.map((endpoint) => <li key={endpoint}><code>{endpoint}</code></li>)}</ul>
      </section>
      <section className="card">
        <h2>SDK</h2>
        <p>TypeScript client scaffold is available in the SDK section.</p>
        <Link href="/sdk">Open SDK resources</Link>
      </section>
    </main>
  );
}
