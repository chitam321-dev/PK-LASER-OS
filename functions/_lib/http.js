import { json } from './auth.js';

export async function readJson(request) {
  try { return { body: await request.json() }; }
  catch { return { error: json({ error: 'invalid_json' }, 400) }; }
}

export function clean(value, max = 500) {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
}

export function id(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;
}

export function parseJson(value, fallback = null) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

export function pagination(url, max = 100) {
  const u = new URL(url);
  const limit = Math.min(max, Math.max(1, Number(u.searchParams.get('limit')) || 50));
  const offset = Math.max(0, Number(u.searchParams.get('offset')) || 0);
  return { u, limit, offset };
}

export async function event(db, ticketId, actorId, eventType, payload = null) {
  await db.prepare(`INSERT INTO ticket_events (id,ticket_id,actor_user_id,event_type,payload)
    VALUES (?,?,?,?,?)`).bind(id('evt'), ticketId, actorId, eventType, payload ? JSON.stringify(payload) : null).run();
}
