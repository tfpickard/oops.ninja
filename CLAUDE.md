# Claude Instructions — Next.js Ultra Template (Vercel-Native)

This project expects premium quality output, not MVP shortcuts.

## Focus order

1. User experience polish
2. Correctness and maintainability
3. Accessibility and performance
4. Operational readiness (CI/CD + observability)
5. Full deployability in Vercel ecosystem

## Preferred implementation style

- Next.js App Router with server-first rendering
- Strong contracts and validated boundaries
- Thoughtful loading/error/empty states
- Composable components and design-token consistency
- Vercel-native services for data/cache/storage/scheduling

## Multi-agent expectations

Work as if other agents will review and extend your changes.
Always provide:
- implementation intent
- constraints and tradeoffs
- validation evidence
- follow-up risks
- Vercel runtime/env assumptions

## Avoid

- Hidden complexity
- fragile quick fixes
- untested behavior
- infrastructure assumptions that cannot run in Vercel
- skipping docs for architectural changes
