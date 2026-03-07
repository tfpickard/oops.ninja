# Product & Release Checklist — Next.js Excellence

Use this before every production release.

## 1) UX and design polish

- [ ] Critical flows include intentional loading/empty/error/success states
- [ ] Copy is clear, concise, and action-oriented
- [ ] Motion is subtle, performant, and purposeful
- [ ] Design tokens are used consistently
- [ ] Visual QA completed across desktop/tablet/mobile

## 2) Accessibility

- [ ] Keyboard navigation works end-to-end
- [ ] Interactive elements have clear labels and focus states
- [ ] Color contrast meets WCAG AA
- [ ] Semantic landmarks and heading structure validated
- [ ] Screen-reader pass for key user journeys

## 3) Performance

- [ ] Core Web Vitals meet SLO targets
- [ ] Lighthouse thresholds pass in CI
- [ ] Bundle size budgets are within limits
- [ ] Route-level caching/revalidation decisions documented
- [ ] Images/fonts optimized and non-blocking

## 4) Reliability and operations

- [ ] Structured logging enabled on critical paths
- [ ] Error tracking includes release + environment metadata
- [ ] Tracing spans exist for core requests/jobs
- [ ] Synthetic health checks pass post-deploy
- [ ] Rollback playbook tested and documented

## 5) Security and privacy

- [ ] AuthN/AuthZ checks validated for protected routes/actions
- [ ] Input validation enforced at all external boundaries
- [ ] Secrets managed in Vercel project settings, never hardcoded
- [ ] Dependency and secret scanning pass
- [ ] Privacy and data retention requirements verified

## 6) CI/CD readiness (Vercel)

- [ ] All required GitHub checks are green
- [ ] Vercel preview deployment validated by QA/PM/design
- [ ] `vercel build` passes with production env configuration
- [ ] Migration steps reviewed (if schema changes)
- [ ] Canary or phased rollout strategy selected
- [ ] Release notes and incident contacts prepared

## 7) Vercel ecosystem readiness

- [ ] Data dependencies mapped to Vercel-compatible services (Postgres/KV/Blob)
- [ ] Edge vs Node runtime decisions documented per route
- [ ] Vercel env vars are scoped correctly (preview/production)
- [ ] Cron/scheduled jobs configured in Vercel
- [ ] Rollback target deployment identified

## 8) Multi-agent delivery hygiene

- [ ] Architect handoff documented with scope and risks
- [ ] Builder validation included in PR
- [ ] Verifier report attached (tests + failure modes)
- [ ] Polish review complete (UX/accessibility)
- [ ] Release readiness explicitly signed off
