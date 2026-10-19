# PK LASER OS — AGI-ready architecture

## Purpose and limits

Build a measurable, auditable AI operating layer for PK LASER. "AGI-ready" describes a modular architecture that can support increasingly capable models and workflows; it is not a claim that the system is AGI, autonomous, or reliably correct.

This first increment establishes typed task/plan contracts and a pure action-policy gate. It does not connect an LLM, execute tools, create a vector database, change the database schema, or deploy production.

## Architecture

1. **Experience layer** — authenticated workspace for employees, with role- and company-scoped access.
2. **Orchestrator** — turns a request into a typed task, plans bounded steps, routes to domain agents, tracks budgets/timeouts and handles cancellation.
3. **Domain agents** — executive, sales, service, inventory, marketing, finance and engineering. Agents share contracts and policy, but receive only the tools and data required for their domain.
4. **Knowledge layer** — versioned technical manuals, service tickets, machine/part catalogue, SOPs, approved commercial rules and company policies. Every retrieved fact should retain source, version, timestamp and access scope.
5. **Memory layer** — separate short-lived task state, user-approved preferences, and durable business knowledge. Do not silently promote model-generated guesses into trusted memory.
6. **Tool gateway** — allowlisted, schema-validated tools with least privilege, timeouts, idempotency keys, quotas and redacted logs.
7. **Evaluation and observability** — trace each task and tool call, capture evidence, score output quality, record latency/cost/error rates and run regression sets before model or prompt changes.
8. **Human control plane** — approval queue, kill switch, action budgets, escalation rules and rollback path.

## Agent execution lifecycle

1. Authenticate the requester and determine role, scope and purpose.
2. Validate the task against the agent task schema; reject malformed or oversized input.
3. Retrieve only authorized knowledge, keeping citations/source metadata.
4. Produce a bounded plan matching the agent plan schema; check dependency IDs, step count and tool allowlist.
5. Evaluate each action with the policy gate. Approval must be recorded outside model output and verified by the tool gateway.
6. Execute one step at a time; validate tool arguments and outputs. Never treat content retrieved from documents, websites, emails or tickets as trusted system instructions.
7. Verify the result against expected evidence and final checks; retry only within bounded limits.
8. Return conclusions with evidence, uncertainty, failed checks and recommended next actions.
9. Persist a redacted audit record; retain only data needed for the business purpose.

## Autonomy levels

- **L0 — Explain:** answer from approved knowledge, with source references.
- **L1 — Recommend:** compare options and produce a plan; no side effects.
- **L2 — Draft:** prepare a quotation follow-up, content, ticket update or work order for review.
- **L3 — Approved action:** execute a narrowly scoped internal/external action only after explicit, recorded approval.
- **L4 — Bounded automation:** recurring low-risk actions with predefined limits, monitoring, an owner and a kill switch.
- **Production/database changes:** never enabled by a general agent permission. They require the existing release/change-management process and separate authorization.

Start at L0/L1. Do not skip levels based on model confidence alone.

## Initial use cases with business value

### Technical service copilot
Input: machine serial/model, material, thickness, power, controller/head, alarm code, symptoms and recent maintenance.
Output: ranked hypotheses, discriminating checks, safety precautions, manual references and suggested parts. Require technician confirmation; never invent cutting parameters or instruct unsafe laser operations without source-backed limits.

### Sales copilot
Summarize CRM history, classify product fit from explicit business signals, draft next steps and flag overdue quotations. No automatic discount, credit approval, mass outreach or customer-facing message without the required permission.

### Executive copilot
Prepare a daily/weekly view of sales, service SLA, stock-outs, cash/receivables and marketing conversion. Each metric must disclose source, time range, missing data and calculation method.

### Marketing copilot
Generate source-grounded content drafts and campaign experiments. Publishing and messaging require approved account connections, consent/suppression checks and human approval until an evaluated policy explicitly permits a narrower automated workflow.

## Safety and security requirements

- Treat all model output as untrusted input; validate with schemas and domain rules.
- Enforce access control at every data/tool boundary, not only in the UI.
- Separate read, draft, internal-write, external-send, shared-database mutation and production deployment permissions.
- Keep credentials in server-side secret storage; never expose tokens to the browser or logs.
- Require idempotency, rate limits, deadlines, maximum steps and per-task spend limits.
- Keep a redacted, append-oriented audit trail of requester, policy decision, approval, tool, result and verification.
- Protect against prompt injection, data exfiltration, cross-customer leakage and tool output spoofing.
- Provide a kill switch and a human escalation path.
- Do not train on customer data or add data to durable memory without a documented purpose and retention policy.

## Data architecture decision gate

The Next.js branch currently declares Neon/PostgreSQL through Drizzle. Prior project notes also mention a Cloudflare Worker/D1 CRM. The canonical source of truth is not yet verified. Do not add AI memory tables, vector tables, event tables or dual writes until the database owner, environment mapping, schema inventory, backup/restore and migration baseline are confirmed. Start knowledge retrieval with a read-only adapter over an approved staging dataset.

## Evaluation before rollout

Create a versioned test set using approved, de-identified PK LASER cases:
- known technical symptoms with verified root cause and manual citation;
- ambiguous cases where the correct behavior is to ask a question;
- unsafe requests where the agent must stop or escalate;
- duplicate leads and consent/opt-out edge cases;
- role-boundary and prompt-injection attempts;
- stale/missing source data and tool failures.

Track grounded-answer rate, citation correctness, unsafe-action block rate, task completion, human correction rate, latency, cost per task and escalation rate. Define thresholds and owners before pilot; compare versions on the same test set.

## Delivery phases

1. **Foundation (current):** typed contracts, action policy, architecture documentation and CI validation.
2. **Read-only copilot:** authenticated API, model-provider adapter, approved retrieval source and evidence-linked answers.
3. **Evaluation harness:** regression cases, traces, quality metrics and redacted audit events.
4. **Drafting agents:** sales/service/marketing drafts with role checks and approval workflow.
5. **Approved tools:** narrowly scoped actions, idempotency, quotas, approval ledger and rollback.
6. **Bounded automation:** only after evidence of reliability and explicit business owner approval.

## Acceptance criteria for the first increment

- Task and plan payloads are schema validated.
- Consequential actions fail closed without recorded approval.
- Production deployment is blocked by the policy helper.
- No model provider, secret, production DB or external account is connected.
- Typecheck, lint and build pass in CI before the next implementation step.
