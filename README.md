# oops.ninja

Production-oriented SaaS platform for controlled narrative generation and operational communication recovery.

## Product status

### Phase 1 complete
- Landing page and operational dashboard UX
- Generation + rewrite APIs with moderation and rate limiting
- Saved generation history and usage snapshots
- API key lifecycle (create/list/delete)
- OpenAPI endpoint and documentation route

### Phase 2 complete
- Admin command center
- Organization management API
- Billing profile endpoint and portal links contract
- Analytics summary API
- Share link workflows for generation artifacts
- TypeScript SDK snippet endpoint and docs route

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

curl http://localhost:3000/api/v1/generations?limit=10&offset=0
curl http://localhost:3000/api/v1/analytics/summary
curl http://localhost:3000/api/v1/billing/portal
```
