import { clearSessionCookie, getCookie, json } from '../../_lib/auth.js';

export async function onRequestPost(context) {
  const token = getCookie(context.request, 'pk_session');
  if (token) await context.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run();
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
}
