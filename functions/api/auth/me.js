import { json, requireUser } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context);
  if (auth.error) return auth.error;
  return json({ user: auth.user });
}
