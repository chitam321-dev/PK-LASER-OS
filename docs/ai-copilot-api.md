# PK LASER OS Copilot — first read-only API

Endpoint: `POST /api/ai/copilot`

## Behavior
- Requires a valid PK LASER OS session cookie for any recognized role (admin, sales, technical).
- Accepts JSON `{"question":"..."}`; rejects declared request bodies over 20,000 bytes before parsing, then trims and caps the question at 4,000 characters.
- Calls the OpenAI Responses API with server-side `OPENAI_API_KEY` and `OPENAI_MODEL`, `store: false`, a 25-second timeout, and a 1,200-token output cap.
- No tools are exposed to the model. The endpoint does not read or write business data, send messages, or execute actions.
- Returns `mode: "read_only_copilot"` and explicit limitations. Provider error bodies and credentials are not returned to the client.
- If the server-side configuration is absent, returns HTTP 503 rather than pretending an AI answer was generated.

## Environment setup
Configure `OPENAI_API_KEY` and `OPENAI_MODEL` only in the server-side Preview environment first. Select a model available to the approved API project and apply its cost limits in the provider account. Never add real secrets to `.env.example`, source control, or browser code.

## Example request
```http
POST /api/ai/copilot
Content-Type: application/json
Cookie: pk_session=<valid-session>
```
```json
{"question":"Hãy lập checklist chẩn đoán máy laser cắt không đứt, nêu rõ dữ liệu cần hỏi thêm và các bước an toàn."}
```

## Limitations and next gates
- This is not retrieval-augmented generation (RAG): no internal manuals, tickets, machine records, CRM or inventory are connected.
- The authenticated chat UI is available at `/ai`. There is still no durable per-user rate limiter or cost ledger; apply provider quotas and deployment-level rate limiting before broad rollout.
- API availability, actual model responses, authorization, cost, and timeout behavior must be verified in Preview after credentials are configured. The content-length guard only handles requests that declare their size; schema validation remains mandatory.
- Next: build read-only retrieval from an approved, de-identified staging knowledge set; add evaluation tests and auditable cost/rate limits.
- Do not configure Production secrets or deploy to Production as part of this increment.
