import { json, requireUser, randomToken } from '../../_lib/auth.js';
import { inferDiagnosis, loadKnowledge } from '../../_lib/diagnostic.js';

export async function onRequestPost(context) {
  const auth = await requireUser(context, ['admin', 'technical']);
  if (auth.error) return auth.error;

  let body;
  try { body = await context.request.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }

  const machineId = body.machineId ? String(body.machineId) : null;
  const ticketId = body.ticketId ? String(body.ticketId) : null;
  const evidence = Array.isArray(body.evidence) ? body.evidence : [];

  if (!evidence.length) return json({ error: 'evidence_required' }, 400);
  if (evidence.length > 50) return json({ error: 'too_many_evidence_items' }, 400);

  const signalCodes = [...new Set(evidence.map(x => String(x?.signalCode || '')).filter(Boolean))];
  if (!signalCodes.length) return json({ error: 'valid_signal_required' }, 400);

  if (machineId) {
    const machine = await context.env.DB.prepare('SELECT id FROM machines WHERE id = ? LIMIT 1').bind(machineId).first();
    if (!machine) return json({ error: 'machine_not_found' }, 404);
  }

  if (ticketId) {
    const ticket = await context.env.DB.prepare('SELECT id, machine_id FROM service_tickets WHERE id = ? LIMIT 1').bind(ticketId).first();
    if (!ticket) return json({ error: 'ticket_not_found' }, 404);
    if (machineId && ticket.machine_id !== machineId) return json({ error: 'ticket_machine_mismatch' }, 409);
  }

  const knowledge = await loadKnowledge(context.env.DB, signalCodes);
  if (!knowledge.causes.length) {
    return json({
      error: 'insufficient_knowledge',
      message: 'Chưa có quan hệ nhân quả cho các tín hiệu đã nhập.',
      unknownSignals: signalCodes,
    }, 422);
  }

  const result = inferDiagnosis(knowledge, evidence);
  const runId = `diag_${randomToken(18)}`;

  await context.env.DB.prepare(`
    INSERT INTO ai_diagnostic_runs
      (id, machine_id, ticket_id, requested_by, evidence_json, result_json, top_cause_code, top_confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    runId,
    machineId,
    ticketId,
    auth.user.id,
    JSON.stringify(evidence),
    JSON.stringify(result),
    result.topCause?.code || null,
    result.topCause?.confidence ?? null,
  ).run();

  return json({ runId, ...result }, 200);
}
