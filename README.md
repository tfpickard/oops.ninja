# oops.ninja alpha

Production-oriented alpha for controlled narrative generation.

## Features included
- Next.js App Router frontend (`/` and `/dashboard`)
- REST API surface for generation, rewrite, templates, presets, me, usage, generations, api-keys, health, and openapi
- Policy moderation guardrails in enterprise language
- In-memory multi-user context, API key issuance, and rate limiting
- Prisma schema scaffold for Postgres production storage

## Quick start
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## API quick examples
```bash
curl -X POST http://localhost:3000/api/v1/generate \
  -H 'content-type: application/json' \
  -d '{"scenario":"I missed a customer escalation handoff.","mode":"Professional apology","tone":"professional","formality":"executive","accountabilityPosture":"calibrated ownership","audience":"customer","medium":"email"}'
```
