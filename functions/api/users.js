import { json, requireUser } from '../_lib/auth.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context, ['admin', 'technical']);
  if (auth.error) return auth.error;
  const role = new URL(context.request.url).searchParams.get('role');
  const result = role
    ? await context.env.DB.prepare('SELECT id,name,email,role FROM users WHERE is_active=1 AND role=? ORDER BY name').bind(role).all()
    : await context.env.DB.prepare('SELECT id,name,email,role FROM users WHERE is_active=1 ORDER BY name').all();
  return json({ users: result.results || [] });
}
