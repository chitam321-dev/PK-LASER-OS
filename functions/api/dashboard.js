import { json, requireUser } from '../_lib/auth.js';

export async function onRequestGet(context){
 const auth=await requireUser(context);if(auth.error)return auth.error;
 const [summary,statuses,trend,techs,causes,recent]=await Promise.all([
  context.env.DB.prepare(`SELECT (SELECT COUNT(*) FROM machines WHERE status!='retired') machines,(SELECT COUNT(*) FROM service_tickets WHERE status NOT IN ('resolved','closed')) open_tickets,(SELECT COUNT(*) FROM service_tickets WHERE priority='critical' AND status NOT IN ('resolved','closed')) critical_tickets,(SELECT COUNT(*) FROM service_tickets WHERE opened_at>=datetime('now','-30 days')) tickets_30d,(SELECT ROUND(AVG((julianday(resolved_at)-julianday(opened_at))*24),1) FROM service_tickets WHERE resolved_at IS NOT NULL AND resolved_at>=datetime('now','-30 days')) mttr_hours`).first(),
  context.env.DB.prepare('SELECT status,COUNT(*) count FROM service_tickets GROUP BY status').all(),
  context.env.DB.prepare(`SELECT date(opened_at) day,COUNT(*) opened,SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) resolved FROM service_tickets WHERE opened_at>=date('now','-13 days') GROUP BY date(opened_at) ORDER BY day`).all(),
  context.env.DB.prepare(`SELECT u.id,u.name,COUNT(t.id) active_count,SUM(CASE WHEN t.status='diagnosing' THEN 1 ELSE 0 END) diagnosing_count FROM users u LEFT JOIN service_tickets t ON t.assigned_to=u.id AND t.status NOT IN ('resolved','closed') WHERE u.role='technical' AND u.is_active=1 GROUP BY u.id,u.name ORDER BY active_count DESC`).all(),
  context.env.DB.prepare(`SELECT COALESCE(c.name,t.confirmed_cause_code,'Chưa xác định') cause,COUNT(*) count FROM service_tickets t LEFT JOIN ai_causes c ON c.code=t.confirmed_cause_code WHERE t.resolved_at>=datetime('now','-90 days') GROUP BY t.confirmed_cause_code ORDER BY count DESC LIMIT 5`).all(),
  context.env.DB.prepare(`SELECT t.id,t.title,t.priority,t.status,t.opened_at,m.internal_code,m.serial_no,a.name assigned_to_name FROM service_tickets t JOIN machines m ON m.id=t.machine_id LEFT JOIN users a ON a.id=t.assigned_to ORDER BY t.updated_at DESC LIMIT 8`).all()
 ]);
 return json({summary,statuses:statuses.results||[],trend:trend.results||[],technicians:techs.results||[],topCauses:causes.results||[],recent:recent.results||[]});
}
