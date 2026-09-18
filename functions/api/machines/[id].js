import { json, requireUser } from '../../_lib/auth.js';
import { clean, parseJson, readJson } from '../../_lib/http.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context); if (auth.error) return auth.error;
  const machine = await context.env.DB.prepare(`SELECT m.*,q.token qr_token FROM machines m LEFT JOIN machine_qr_tokens q ON q.machine_id=m.id WHERE m.id=?`).bind(context.params.id).first();
  if (!machine) return json({ error:'machine_not_found' },404);
  machine.telemetry = parseJson(machine.telemetry, {});
  const history = await context.env.DB.prepare(`SELECT t.id,t.title,t.issue_detail,t.priority,t.status,t.diagnosis,t.resolution,t.confirmed_cause_code,t.opened_at,t.resolved_at,
    creator.name created_by_name,assignee.name assigned_to_name
    FROM service_tickets t JOIN users creator ON creator.id=t.created_by LEFT JOIN users assignee ON assignee.id=t.assigned_to
    WHERE t.machine_id=? ORDER BY t.opened_at DESC LIMIT 100`).bind(machine.id).all();
  return json({ machine, repairHistory: history.results || [], qrUrl: machine.qr_token ? `/?qr=${machine.qr_token}` : null, qrImageUrl:`/api/machines/${machine.id}/qr` });
}

export async function onRequestPatch(context) {
  const auth = await requireUser(context,['admin','technical']); if(auth.error)return auth.error;
  const parsed=await readJson(context.request); if(parsed.error)return parsed.error; const b=parsed.body;
  const current=await context.env.DB.prepare('SELECT * FROM machines WHERE id=?').bind(context.params.id).first();
  if(!current)return json({error:'machine_not_found'},404);
  const v=(key,max,old)=>Object.hasOwn(b,key)?clean(b[key],max):old;
  await context.env.DB.prepare(`UPDATE machines SET internal_code=?,model=?,customer_name=?,customer_phone=?,location=?,cutting_head=?,controller=?,height_controller=?,laser_source=?,chiller=?,servo_brand=?,status=?,installed_at=?,warranty_until=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(v('internalCode',100,current.internal_code),v('model',150,current.model),v('customerName',200,current.customer_name),v('customerPhone',50,current.customer_phone),v('location',300,current.location),v('cuttingHead',100,current.cutting_head),v('controller',100,current.controller),v('heightController',100,current.height_controller),v('laserSource',100,current.laser_source),v('chiller',100,current.chiller),v('servoBrand',100,current.servo_brand),v('status',30,current.status),v('installedAt',30,current.installed_at),v('warrantyUntil',30,current.warranty_until),v('notes',4000,current.notes),context.params.id).run();
  return json({ok:true});
}
