# Contributing Guide — High-Polish, High-Trust Shipping

## Branch and PR workflow

1. Create a focused branch (`feat/...`, `fix/...`, `chore/...`).
2. Ship in thin vertical slices (UI + logic + tests together).
3. Keep PRs reviewable (< ~500 lines changed preferred).
4. Include context, risk notes, and validation evidence.

## Required PR contents

- Problem statement and outcome
- Scope (routes/components/services touched)
- Screenshots/GIFs for UI changes
- Test evidence (commands + results)
- Accessibility notes
- Performance impact notes
- Vercel deployment notes (preview URL behavior, env impact)
- Rollback considerations for risky changes

## Engineering standards

- TypeScript strict mode for JS/TS code.
- Server Components first in Next.js.
- Shared validation schemas at boundaries.
- Prefer Vercel ecosystem services for storage, cache, and scheduled execution.
- No TODO-driven dead ends in merged code.
- Prefer composable modules over large utility dumps.

## Testing requirements

- Unit tests for logic and transformations.
- Integration tests for DB/API boundaries.
- Playwright smoke tests for critical user paths.
- Accessibility checks for significant UI changes.
- Validate that `vercel build` succeeds for deploy safety.

## CI/CD policy

A PR cannot merge unless required checks pass:
- Lint
- Typecheck
- Unit/integration tests
- E2E smoke
- Security scan
- Performance budget checks
- Vercel build validation

## Definition of done

A change is done only when:
- Behavior implemented and documented
- Tests pass in CI
- UX states are polished (loading/empty/error/success)
- Observability hooks are in place where relevant
- Risk and rollout notes are captured
- Vercel preview deployment behavior is reviewed
