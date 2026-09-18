import { json } from '../_lib/auth.js';

export async function onRequestGet(context) {
  const row = await context.env.DB.prepare('SELECT 1 AS ok').first();
  return json({ ok: row?.ok === 1, service: 'pk-laser-os' });
}
