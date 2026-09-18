import { json, requireUser } from '../../../_lib/auth.js';
import { clean, event, id, readJson } from '../../../_lib/http.js';

export async function onRequestPost(context){
 const auth=await requireUser(context,['admin','technical']);if(auth.error)return auth.error;const parsed=await readJson(context.request);if(parsed.error)return parsed.error;const b=parsed.body;
 const ticket=await context.env.DB.prepare('SELECT id,assigned_to,status FROM service_tickets WHERE id=?').bind(context.params.id).first();if(!ticket)return json({error:'ticket_not_found'},404);
 if(auth.user.role==='technical'&&ticket.assigned_to&&ticket.assigned_to!==auth.user.id)return json({error:'ticket_assigned_to_other_technician'},403);
 const description=clean(b.description,5000);if(!description)return json({error:'description_required'},400);const actionType=clean(b.actionType,30)||'note';
 const actionId=id('act'),minutes=Math.max(0,Number(b.minutesSpent)||0);await context.env.DB.prepare(`INSERT INTO repair_actions (id,ticket_id,actor_user_id,action_type,description,result,parts_json,minutes_spent) VALUES (?,?,?,?,?,?,?,?)`).bind(actionId,ticket.id,auth.user.id,actionType,description,clean(b.result,3000),JSON.stringify(Array.isArray(b.parts)?b.parts:[]),minutes).run();
 await context.env.DB.prepare(`UPDATE service_tickets SET labor_minutes=labor_minutes+?,status=CASE WHEN status IN ('open','assigned') THEN 'diagnosing' ELSE status END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(minutes,ticket.id).run();
 await event(context.env.DB,ticket.id,auth.user.id,'repair_action_added',{actionId,actionType,minutes});return json({id:actionId},201);
}
