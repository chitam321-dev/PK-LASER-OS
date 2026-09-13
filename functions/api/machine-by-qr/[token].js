import { json, requireUser } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  const auth=await requireUser(context);if(auth.error)return auth.error;
  const row=await context.env.DB.prepare(`SELECT m.id,m.serial_no,m.internal_code,m.model,m.customer_name,m.location,m.status FROM machine_qr_tokens q JOIN machines m ON m.id=q.machine_id WHERE q.token=?`).bind(context.params.token).first();
  if(!row)return json({error:'invalid_qr'},404);
  return json({machine:row});
}
