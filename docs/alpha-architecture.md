# oops.ninja Alpha Architecture

## Runtime
- Next.js App Router on Node runtime.
- API route handlers under `/api/v1/*`.

## Safety
- Request moderation layer blocks high-risk requests and responds in policy language.
- Rate limiting per user + action.

## Data
- Alpha runtime uses in-memory store for speed.
- Prisma schema included for production migration to Postgres.

## Deployability
- Deployable to Vercel as a single app.
- Redis and Stripe integration points are scaffolded as follow-up work.
