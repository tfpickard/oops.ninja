# Multi-Agent Delivery Protocol (Next.js-First, Vercel-Native)

Use this document as the operating contract for human + AI collaboration.

## Mission

Ship **beautiful, fast, accessible, and reliable** Next.js products with a repeatable system that supports multiple agents working in parallel and deploys fully on Vercel.

## Agent roles and responsibilities

### 1) Architect Agent
- Owns architecture, route boundaries, data flow, and ADRs.
- Defines contracts: schemas, API types, and state ownership.
- Maps infra dependencies to Vercel-native services (Postgres/KV/Blob/Cron).
- Produces implementation plan with risk register.

### 2) Builder Agent
- Implements slices in small, reviewable increments.
- Follows architecture contracts exactly.
- Adds tests in the same PR as behavior changes.

### 3) Verifier Agent
- Validates correctness, resilience, and security.
- Expands test coverage for edge and failure cases.
- Runs regression + compatibility checks.

### 4) Polish Agent
- Upgrades UX quality: loading/empty/error states, motion, copy clarity.
- Verifies WCAG AA, keyboard flow, and color contrast.
- Enforces design-system consistency.

### 5) Release Agent
- Owns CI/CD health, release notes, deployment checks, and rollback confidence.
- Confirms Vercel preview behavior and production rollout safety.
- Confirms observability hooks and runbooks are updated.

---

## Handoff contract (required)

Every handoff must include:

1. **Goal** — what is being changed and why
2. **Scope** — files/routes/components touched
3. **Constraints** — performance, accessibility, security, and runtime constraints
4. **Validation** — tests/checks already run + results
5. **Deployability** — Vercel env/runtime/service assumptions
6. **Risks** — unresolved risks and follow-ups

No “silent handoffs.” If a role cannot complete validation, it must explicitly document the block.

---

## Next.js implementation standards

- Default to **Server Components**.
- Keep client components focused on interactive islands.
- Prefer **Server Actions** for mutations unless API route separation is required.
- Define cache semantics per route (`force-cache`, `revalidate`, or dynamic).
- Make all user-visible states explicit: loading, empty, error, success.
- Keep route-level boundaries intentional (`layout.tsx`, `loading.tsx`, `error.tsx`).
- Document **Edge vs Node** runtime decisions for every non-trivial route.

---

## Quality gates (must pass before merge)

- Type checks pass
- Lint and format pass
- Unit + integration tests pass
- E2E smoke tests pass
- Accessibility checks pass
- Performance budget checks pass
- `vercel build` passes

If any gate fails, the PR is blocked.

---

## Personality presets (optional but recommended)

- **Precision Architect**: conservative, evidence-first, constraint-aware
- **Speed Builder**: fast iteration, strict on test inclusion
- **Skeptical Verifier**: adversarial test mindset, failure-mode focused
- **Craft Designer**: visual polish, interaction quality, accessibility detail
- **Calm Release Captain**: operational discipline, rollback readiness

Assign one preset per agent session to improve role clarity.
