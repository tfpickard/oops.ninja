import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    openapi: '3.0.3',
    info: { title: 'oops.ninja API', version: '0.2.1' },
    paths: {
      '/api/v1/generate': { post: { summary: 'Generate response variants' } },
      '/api/v1/rewrite': { post: { summary: 'Rewrite text' } },
      '/api/v1/templates': { get: { summary: 'List templates' } },
      '/api/v1/presets': { get: { summary: 'List presets' } },
      '/api/v1/me': { get: { summary: 'Get caller' } },
      '/api/v1/usage': { get: { summary: 'Usage metrics' } },
      '/api/v1/generations': { get: { summary: 'Generation history (supports limit/offset pagination)' } },
      '/api/v1/api-keys': {
        get: { summary: 'List API keys' },
        post: { summary: 'Create API key' },
      },
      '/api/v1/api-keys/{id}': { delete: { summary: 'Delete API key by id' } },
      '/api/v1/admin/overview': { get: { summary: 'Admin metrics overview' } },
      '/api/v1/organizations': {
        get: { summary: 'List organizations' },
        post: { summary: 'Create organization' },
      },
      '/api/v1/analytics/summary': { get: { summary: 'Analytics summary for caller' } },
      '/api/v1/billing/portal': { get: { summary: 'Billing profile and portal links' } },
      '/api/v1/generations/{id}/share': { post: { summary: 'Create temporary share link for a generation' } },
      '/api/v1/shares/{token}': { get: { summary: 'Resolve shared generation artifact' } },
      '/api/v1/sdk/typescript': { get: { summary: 'Retrieve TypeScript SDK snippet' } },
      '/api/v1/health': { get: { summary: 'Health check' } },
    },
  });
}
