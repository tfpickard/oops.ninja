import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    openapi: '3.0.3',
    info: { title: 'oops.ninja API', version: '0.1.0' },
    paths: {
      '/api/v1/generate': { post: { summary: 'Generate response variants' } },
      '/api/v1/rewrite': { post: { summary: 'Rewrite text' } },
      '/api/v1/templates': { get: { summary: 'List templates' } },
      '/api/v1/presets': { get: { summary: 'List presets' } },
      '/api/v1/me': { get: { summary: 'Get caller' } },
      '/api/v1/usage': { get: { summary: 'Usage metrics' } },
      '/api/v1/generations': { get: { summary: 'Generation history' } },
      '/api/v1/api-keys': {
        get: { summary: 'List API keys' },
        post: { summary: 'Create API key' },
        delete: { summary: 'Delete API key' },
      },
      '/api/v1/health': { get: { summary: 'Health check' } },
    },
  });
}
