# Next.js Ultra Template — Vercel-Native, Multi-Agent, Production-Hardened

This template is built for teams that want to ship **exceptional Next.js products** with **bleeding-edge engineering**, **multi-agent execution**, and **enterprise-grade CI/CD**—fully runnable in **Vercel and its ecosystem**.

It is intentionally opinionated: polish, reliability, and velocity are treated as features.

## Why this template exists

Most templates optimize for “hello world.”
This one optimizes for **“ship world-class repeatedly.”**

- **Next.js-first** (App Router, RSC, Server Actions, PPR-ready architecture)
- **Vercel-native hosting model**: app, preview envs, runtime, and managed services
- **Multi-agent friendly** workflows with explicit roles and handoffs
- **Strict quality gates**: tests, linting, type checks, accessibility, and performance budgets
- **Beautiful-by-default product delivery** with design-system and UX polish standards

---

## Core stack (2026-ready defaults)

### Frontend / Product
- **Next.js** (App Router + React Server Components)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** + tokenized design system
- **shadcn/ui + Radix primitives** for accessible foundations
- **Motion** (Framer Motion) for deliberate micro-interactions

### Data / Backend (Vercel ecosystem)
- **Vercel Postgres** (primary relational store)
- **Prisma or Drizzle**
- **Vercel KV** for low-latency cache/session patterns
- **Vercel Blob** for object/file storage
- **tRPC or OpenAPI + Zod contracts**
- **Vercel Cron / background jobs via Vercel-compatible workers**

### Platform / Ops
- **Vercel-first deployment** (preview + production + rollback)
- **OpenTelemetry + Sentry + structured logs**
- **GitHub Actions CI/CD** with parallel quality lanes and Vercel build validation

### Testing and quality
- **Vitest** for unit tests
- **Playwright** for E2E and smoke validation
- **Testing Library** for component behavior
- **Lighthouse CI + axe checks** for perf + accessibility

---

## Multi-agent operating model

This template assumes you use multiple AI/human roles in parallel:

1. **Architect Agent** — updates system design and interfaces
2. **Builder Agent** — implements feature slices
3. **Verifier Agent** — tests, threat-models, and validates quality gates
4. **Polish Agent** — improves UX, copy, loading/error states, and accessibility
5. **Release Agent** — handles CI/CD, changelog, and release readiness

See [agent.md](agent.md) for role contracts and handoff protocol.

---

## Suggested repository layout

```txt
.
├── apps/
│   └── web/                  # Next.js app deployed on Vercel
├── packages/
│   ├── ui/                   # design system + components
│   ├── config/               # eslint, tsconfig, prettier, tailwind presets
│   └── contracts/            # shared schemas / API types
├── docs/
│   ├── architecture/
│   ├── runbooks/
│   └── adr/
├── .github/workflows/
└── README.md
```

---

## Next.js excellence checklist

- RSC by default; client components only where needed
- Server Actions for mutation flows when appropriate
- Route segment boundaries with `loading.tsx`, `error.tsx`, and `not-found.tsx`
- PPR/caching strategy documented per route
- Metadata API completed for all public pages
- Image/Font optimization configured
- Edge/runtime decisions explicit

See [ARCHITECTURE.md](ARCHITECTURE.md) and [PROJECT_CHECKLIST.md](PROJECT_CHECKLIST.md).

---

## CI/CD expectations

A pull request is mergeable only if all quality lanes pass:

- Lint + format checks
- Type checks
- Unit tests
- E2E smoke tests
- Accessibility checks
- Lighthouse/performance thresholds
- Security scanning (dependency + secret scanning)
- **Vercel build validation**

A reference workflow is included at [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Start here

- [agent.md](agent.md) — multi-agent roles, contracts, and delivery protocol
- [ARCHITECTURE.md](ARCHITECTURE.md) — Next.js system blueprint and Vercel-native decisions
- [CONTRIBUTING.md](CONTRIBUTING.md) — branch strategy, quality gates, and PR standards
- [PROJECT_CHECKLIST.md](PROJECT_CHECKLIST.md) — release readiness and polish checklist
- [codex.md](codex.md) / [Claude.md](Claude.md) — AI-agent-specific execution instructions
