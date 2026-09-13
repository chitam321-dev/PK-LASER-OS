import { json, requireUser } from '../../_lib/auth.js';
import { clean, event, id, pagination, readJson } from '../../_lib/http.js';

export async function onRequestGet(context) {
  const auth=await requireUser(context); if(auth.error)return auth.error;
  const {u,limit,offset}=pagination(context.request.url); const status=clean(u.searchParams.get('status'),30); const machine=clean(u.searchParams.get('machineId'),100);
  const mine=u.searchParams.get('mine')==='1';
  let sql=`SELECT t.*,m.serial_no,m.internal_code,m.model,c.name created_by_name,a.name assigned_to_name
    FROM service_tickets t JOIN machines m ON m.id=t.machine_id JOIN users c ON c.id=t.created_by LEFT JOIN users a ON a.id=t.assigned_to WHERE 1=1`;
  const args=[];
  if(status){sql+=' AND t.status=?';args.push(status)} if(machine){sql+=' AND t.machine_id=?';args.push(machine)} if(mine){sql+=' AND t.assigned_to=?';args.push(auth.user.id)}
  sql+=' ORDER BY CASE t.priority WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'normal\' THEN 3 ELSE 4 END,t.opened_at DESC LIMIT ? OFFSET ?';args.push(limit,offset);
  const rows=await context.env.DB.prepare(sql).bind(...args).all(); return json({tickets:rows.results||[],limit,offset});
}

export async function onRequestPost(context) {
  const auth=await requireUser(context); if(auth.error)return auth.error;
  const parsed=await readJson(context.request);if(parsed.error)return parsed.error;const b=parsed.body;
  const machineId=clean(b.machineId,100),detail=clean(b.issueDetail,5000); if(!machineId||!detail)return json({error:'machine_and_issue_required'},400);
  const machine=await context.env.DB.prepare('SELECT id FROM machines WHERE id=?').bind(machineId).first();if(!machine)return json({error:'machine_not_found'},404);
  const ticketId=id('tkt'), assigned=clean(b.assignedTo,100); const status=assigned?'assigned':'open';
  await context.env.DB.prepare(`INSERT INTO service_tickets (id,machine_id,created_by,assigned_to,title,issue_detail,symptom_code,priority,status) VALUES (?,?,?,?,?,?,?,?,?)`).bind(ticketId,machineId,auth.user.id,assigned,clean(b.title,200)||detail.slice(0,80),detail,clean(b.symptomCode,100),clean(b.priority,20)||'normal',status).run();
  await event(context.env.DB,ticketId,auth.user.id,'ticket_created',{assignedTo:assigned,priority:clean(b.priority,20)||'normal'});
  return json({id:ticketId,status},201);
}
