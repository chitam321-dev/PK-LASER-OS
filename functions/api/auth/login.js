import { hashPassword, json, randomToken, sessionCookie } from '../../_lib/auth.js';

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return json({ error: 'email_and_password_required' }, 400);

  const user = await context.env.DB.prepare(`
    SELECT id, email, name, role, password_hash, password_salt, is_active
    FROM users WHERE email = ? LIMIT 1
  `).bind(email).first();

  if (!user || !user.is_active) return json({ error: 'invalid_credentials' }, 401);
  const candidate = await hashPassword(password, user.password_salt);
  if (candidate !== user.password_hash) return json({ error: 'invalid_credentials' }, 401);

  await context.env.DB.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  const token = randomToken(32);
  await context.env.DB.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, datetime('now', '+7 days'))
  `).bind(token, user.id).run();

  return json(
    { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
    200,
    { 'set-cookie': sessionCookie(token) },
  );
}
