import { json, requireUser, randomToken } from '../../_lib/auth.js';
import { updateLearningFromFeedback } from '../../_lib/diagnostic.js';

export async function onRequestPost(context) {
  const auth = await requireUser(context, ['admin', 'technical']);
  if (auth.error) return auth.error;

  let body;
  try { body = await context.request.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }

  const runId = String(body.runId || '');
  const outcome = String(body.outcome || '');
  const confirmedCauseCode = body.confirmedCauseCode ? String(body.confirmedCauseCode) : null;
  const allowed = ['confirmed', 'rejected', 'partially_confirmed', 'unknown'];

  if (!runId) return json({ error: 'run_id_required' }, 400);
  if (!allowed.includes(outcome)) return json({ error: 'invalid_outcome' }, 400);

  const run = await context.env.DB.prepare('SELECT id, ticket_id FROM ai_diagnostic_runs WHERE id = ? LIMIT 1').bind(runId).first();
  if (!run) return json({ error: 'diagnostic_run_not_found' }, 404);

  if (confirmedCauseCode) {
    const cause = await context.env.DB.prepare('SELECT code FROM ai_causes WHERE code = ? LIMIT 1').bind(confirmedCauseCode).first();
    if (!cause) return json({ error: 'cause_not_found' }, 404);
  }

  const feedbackId = `fb_${randomToken(16)}`;
  await context.env.DB.prepare(`
    INSERT INTO ai_feedback
      (id, diagnostic_run_id, confirmed_cause_code, outcome, action_taken, resolution_note, submitted_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    feedbackId,
    runId,
    confirmedCauseCode,
    outcome,
    body.actionTaken ? String(body.actionTaken).slice(0, 2000) : null,
    body.resolutionNote ? String(body.resolutionNote).slice(0, 5000) : null,
    auth.user.id,
  ).run();

  await updateLearningFromFeedback(context.env.DB, runId, confirmedCauseCode, outcome);

  if (run.ticket_id) {
    await context.env.DB.prepare(`UPDATE service_tickets SET
      confirmed_cause_code=COALESCE(?,confirmed_cause_code),
      diagnosis=COALESCE(?,diagnosis),
      resolution=COALESCE(?,resolution),updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(
      confirmedCauseCode,
      confirmedCauseCode ? `AI + kỹ thuật xác nhận: ${confirmedCauseCode}` : null,
      body.resolutionNote ? String(body.resolutionNote).slice(0,5000) : null,
      run.ticket_id,
    ).run();
    await context.env.DB.prepare(`INSERT INTO ticket_events (id,ticket_id,actor_user_id,event_type,payload)
      VALUES (?,?,?,?,?)`).bind(`evt_${randomToken(16)}`,run.ticket_id,auth.user.id,'ai_feedback',JSON.stringify({runId,outcome,confirmedCauseCode})).run();
  }

  return json({ ok: true, feedbackId, ticketUpdated: Boolean(run.ticket_id), learningApplied: Boolean(confirmedCauseCode && outcome !== 'unknown') });
}
