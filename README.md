# PK LASER AI OS

Production technical operating system for PK LASER with an embedded causal AI diagnostic brain.

## What is implemented

- Cloudflare Pages + Functions + D1
- Real authentication with PBKDF2 password hashes
- HttpOnly/Secure session cookies
- Roles: `admin`, `technical`, `sales`
- Machine, service ticket, event-log, inventory and sales-lead data model
- AI signal/cause/test knowledge graph
- Causal-probabilistic diagnosis engine
- Ranked root-cause probabilities with evidence trace
- Next-best-test recommendations using information gain, cost and risk
- Human-in-the-loop learning from confirmed repair outcomes
- AI diagnostic workspace in the production UI
- `/api/health`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- `/api/ai/diagnose`, `/api/ai/feedback`
- End-to-end operations: Machine Profile → printable QR → camera scan → Service Ticket → technician assignment → repair actions → resolution → machine repair history
- Management KPI dashboard: open/critical tickets, 30-day MTTR, 14-day trend, technician workload and top confirmed causes
- Role-protected operational writes and technician ownership checks

## AI reasoning loop

PK LASER AI follows this operating loop:

1. **Observe** — normalize machine symptoms into canonical signals.
2. **Infer** — score possible causes from the causal graph and prior probabilities.
3. **Explain** — expose the evidence contribution for every ranked cause.
4. **Verify** — recommend the next test with the best expected information value.
5. **Act** — a technician performs the real-world measurement/repair.
6. **Learn** — confirmed outcomes update causal-edge weights for future cases.

The AI is intentionally human-in-the-loop. It supports diagnosis but does not authorize unsafe electrical, optical or mechanical interventions by itself.

## Deploy foundation

1. Create a Cloudflare D1 database named `pk-laser-os`.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.toml` with the real D1 database ID.
3. Apply migrations in order:

```text
migrations/0001_init.sql
migrations/0002_ai_brain.sql
migrations/0003_operations.sql
```

4. Generate the first admin SQL locally without committing a password:

```bash
node tools/create-admin.mjs admin@your-domain.vn "PK LASER Admin" "YOUR-STRONG-PASSWORD"
```

5. Execute the printed SQL against production D1.
6. Deploy the repository as a Cloudflare Pages project with `public` as the output directory and D1 binding `DB`.

## AI API example

`POST /api/ai/diagnose`

```json
{
  "evidence": [
    { "signalCode": "CUT_NOT_THROUGH", "present": true, "confidence": 1 },
    { "signalCode": "FOCUS_DRIFT", "present": true, "confidence": 0.9 }
  ]
}
```

The response contains ranked causes, probabilities, evidence contributions, uncertainty and next recommended tests. After physical verification, submit the confirmed result to `POST /api/ai/feedback` so the causal graph can learn from the repair case.

## Production acceptance flow

1. Sign in as an active user and verify role-based navigation/actions.
2. Create a Machine Profile, open its generated SVG QR and print it.
3. Scan the QR with the mobile camera to resolve the authenticated machine record.
4. Create a ticket, assign a technician and record inspection/measurement/repair actions.
5. Attach an AI diagnosis to the same machine and ticket, then submit confirmed feedback.
6. Resolve/close the ticket with a mandatory resolution and verify it appears in machine history and KPI data.

## Next AI layers

1. Manufacturer alarm knowledge: Raytools/Bochu/WSX/OSPRI/Yaskawa/Panasonic/Inovance/S&A/Hanli and others.
2. Parameter intelligence: cutting recipes, before/after repair telemetry and trend detection.
3. Document intelligence: manuals, service reports and historical tickets converted into structured evidence.
4. Optional multimodal LLM layer for Vietnamese technical conversation, manual retrieval and image interpretation while keeping the causal engine as the auditable source of truth.
5. Predictive maintenance and digital-twin state estimation.
