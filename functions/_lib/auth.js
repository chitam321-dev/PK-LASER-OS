const encoder = new TextEncoder();

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export function getCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  for (const part of cookie.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function sessionCookie(value, maxAgeSeconds = 60 * 60 * 24 * 7) {
  return `pk_session=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie() {
  return 'pk_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export async function hashPassword(password, saltBase64) {
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 },
    key,
    256,
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

export function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function requireUser(context, roles = null) {
  const token = getCookie(context.request, 'pk_session');
  if (!token) return { error: json({ error: 'unauthorized' }, 401) };

  const row = await context.env.DB.prepare(`
    SELECT s.id AS session_id, s.expires_at, u.id, u.email, u.name, u.role, u.is_active
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token).first();

  if (!row || !row.is_active) return { error: json({ error: 'unauthorized' }, 401) };
  if (roles && !roles.includes(row.role)) return { error: json({ error: 'forbidden' }, 403) };

  return { user: { id: row.id, email: row.email, name: row.name, role: row.role } };
}
