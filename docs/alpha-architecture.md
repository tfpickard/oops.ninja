# oops.ninja Architecture

## Runtime strategy
- Next.js App Router on Node runtime.
- API route handlers under `/api/v1/*`.
- Dynamic runtime for dashboard/admin routes where live operations data is expected.

## Safety and control
- Moderation layer blocks high-risk requests and responds in policy language.
- Rate limiting enforced per user and operation class.
- Share links are tokenized and expire automatically.

## Data model posture
- Current runtime uses an in-memory store abstraction optimized for local iteration and integration tests.
- Prisma schema defines the production relational model for Postgres migration.
- API responses include correlation IDs through `requestId` and `x-request-id`.

## Deployability assumptions
- Deployable to Vercel as a single app.
- Redis, Stripe, and durable persistence are isolated behind service/store boundaries for infrastructure-backed rollout.
