import { json, requireUser } from '../../../_lib/auth.js';
import { clean, event, parseJson, readJson } from '../../../_lib/http.js';

async function fullTicket(db,id){
  const ticket=await db.prepare(`SELECT t.*,m.serial_no,m.internal_code,m.model,c.name created_by_name,a.name assigned_to_name FROM service_tickets t JOIN machines m ON m.id=t.machine_id JOIN users c ON c.id=t.created_by LEFT JOIN users a ON a.id=t.assigned_to WHERE t.id=?`).bind(id).first();
  if(!ticket)return null;
  const [events,actions,diagnoses]=await Promise.all([
    db.prepare('SELECT e.*,u.name actor_name FROM ticket_events e JOIN users u ON u.id=e.actor_user_id WHERE ticket_id=? ORDER BY e.created_at').bind(id).all(),
    db.prepare('SELECT r.*,u.name actor_name FROM repair_actions r JOIN users u ON u.id=r.actor_user_id WHERE ticket_id=? ORDER BY r.created_at').bind(id).all(),
    db.prepare('SELECT id,top_cause_code,top_confidence,result_json,created_at FROM ai_diagnostic_runs WHERE ticket_id=? ORDER BY created_at DESC').bind(id).all()
  ]);
  return {ticket,events:(events.results||[]).map(x=>({...x,payload:parseJson(x.payload)})),actions:(actions.results||[]).map(x=>({...x,parts:parseJson(x.parts_json,[])})),diagnoses:(diagnoses.results||[]).map(x=>({...x,result:parseJson(x.result_json,{})}))};
}

export async function onRequestGet(context){const auth=await requireUser(context);if(auth.error)return auth.error;const data=await fullTicket(context.env.DB,context.params.id);return data?json(data):json({error:'ticket_not_found'},404)}

export async function onRequestPatch(context){
  const auth=await requireUser(context,['admin','technical']);if(auth.error)return auth.error;
  const parsed=await readJson(context.request);if(parsed.error)return parsed.error;const b=parsed.body;
  const t=await context.env.DB.prepare('SELECT * FROM service_tickets WHERE id=?').bind(context.params.id).first();if(!t)return json({error:'ticket_not_found'},404);
  if(auth.user.role==='technical'&&t.assigned_to&&t.assigned_to!==auth.user.id)return json({error:'ticket_assigned_to_other_technician'},403);
  const allowed=['open','assigned','diagnosing','waiting_parts','resolved','closed'];const next=clean(b.status,30)||t.status;if(!allowed.includes(next))return json({error:'invalid_status'},400);
  if(next==='closed'&&!clean(b.resolution,5000)&&!t.resolution)return json({error:'resolution_required_to_close'},400);
  const assigned=Object.hasOwn(b,'assignedTo')?clean(b.assignedTo,100):t.assigned_to;
  if(assigned!==t.assigned_to && auth.user.role!=='admin')return json({error:'assignment_requires_admin'},403);
  if(assigned){const target=await context.env.DB.prepare("SELECT id FROM users WHERE id=? AND role='technical' AND is_active=1").bind(assigned).first();if(!target)return json({error:'invalid_assignee'},400)}
  await context.env.DB.prepare(`UPDATE service_tickets SET assigned_to=?,status=?,diagnosis=?,resolution=?,confirmed_cause_code=?,labor_minutes=?,downtime_minutes=?,updated_at=CURRENT_TIMESTAMP,resolved_at=CASE WHEN ? IN ('resolved','closed') THEN COALESCE(resolved_at,CURRENT_TIMESTAMP) ELSE NULL END WHERE id=?`).bind(assigned,next,Object.hasOwn(b,'diagnosis')?clean(b.diagnosis,5000):t.diagnosis,Object.hasOwn(b,'resolution')?clean(b.resolution,5000):t.resolution,Object.hasOwn(b,'confirmedCauseCode')?clean(b.confirmedCauseCode,100):t.confirmed_cause_code,Number(b.laborMinutes??t.labor_minutes)||0,Number(b.downtimeMinutes??t.downtime_minutes)||0,next,t.id).run();
  await event(context.env.DB,t.id,auth.user.id,'ticket_updated',{fromStatus:t.status,toStatus:next,assignedTo:assigned});return json({ok:true,status:next});
}
