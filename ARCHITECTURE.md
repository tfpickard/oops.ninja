# Architecture Defaults — Next.js Bleeding Edge (Vercel-Native)

## Architectural north star

Optimize for:
1. **User-perceived performance**
2. **Product polish and accessibility**
3. **Operational reliability**
4. **Team velocity via clear boundaries**
5. **Single-platform deployability in Vercel ecosystem**

---

## Web app baseline

- **Framework**: Next.js App Router
- **Runtime**: Node.js/Edge on Vercel
- **Rendering model**: RSC-first with minimal client islands
- **Mutations**: Server Actions by default
- **Caching**: explicit per route and data source
- **Styling**: tokenized design system (Tailwind v4 + primitives)
- **Validation**: shared Zod schemas at boundaries

---

## Route and component strategy

- Organize by **route domain**, not by component type.
- Co-locate server data loading and presentational structure when possible.
- Keep domain logic outside UI components.
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` consistently.

Suggested shape:

```txt
apps/web/app/
  (marketing)/
  (app)/
    dashboard/
      page.tsx
      loading.tsx
      error.tsx
      _components/
      _actions/
      _queries/
```

---

## Data and contracts (Vercel ecosystem)

- Define source-of-truth schemas in `packages/contracts`.
- Use **Vercel Postgres** for relational data.
- Use **Vercel KV** for hot cache/session patterns.
- Use **Vercel Blob** for user-uploaded and generated assets.
- Generate derived types from schemas, not vice versa.
- Use typed query/mutation wrappers.
- Ensure each data access path has a caching policy and invalidation strategy.

---

## Performance engineering defaults

- Streaming where useful for perceived responsiveness.
- Aggressive image/font optimization.
- Bundle budgets tracked in CI.
- Prevent unnecessary client hydration.
- Track Core Web Vitals in production.

---

## Reliability and observability

- Structured logs with request correlation IDs.
- Distributed tracing (OpenTelemetry) across edge/server layers.
- Error tracking with release + environment tags.
- SLOs for critical paths (auth, checkout, dashboard load).

---

## Security baseline

- Schema validation at every trust boundary.
- AuthZ checks at route and action level.
- CSRF strategy documented for mutation endpoints.
- Rate limiting and bot/abuse controls in place.
- Secret handling through Vercel-managed encrypted environment variables.

---

## Deployment topology (Vercel)

- **Preview**: every PR gets an isolated Vercel deployment + smoke tests.
- **Production**: protected branch + required status checks.
- **Rollback**: one-click rollback to previous Vercel deployment.
- **Scheduled jobs**: Vercel Cron or Vercel-compatible workers.
- **Post-deploy**: automated health + synthetic checks.
