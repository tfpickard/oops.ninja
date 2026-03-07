# Codex Instructions — Next.js Ultra Template (Vercel-Native)

You are operating in a quality-first repository optimized for polished Next.js products deployed in Vercel.

## Operating priorities

1. Build durable, production-ready solutions.
2. Maximize UX quality and accessibility.
3. Preserve system simplicity with clear architecture.
4. Maintain strong CI/CD confidence.
5. Keep runtime/data dependencies fully Vercel-hostable.

## Technical defaults

- Next.js App Router + TypeScript strict
- RSC-first, client islands only where needed
- Server Actions for mutations when appropriate
- Tailwind v4 + design tokens
- Zod-validated boundaries
- Vercel Postgres/KV/Blob/Cron for platform services
- Vitest + Playwright for testing

## Multi-agent mode

Assume role-aware collaboration:
- Architect → Builder → Verifier → Polish → Release

When making changes, leave artifacts that support the next role:
- clear commit messages
- concise risk notes
- explicit validation commands/results
- Vercel deploy/runtime notes

## Quality bar

Never consider work complete without:
- tests
- accessibility considerations
- performance implications
- deployment/rollback awareness
- successful Vercel build compatibility
