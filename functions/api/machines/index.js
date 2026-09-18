import { json, requireUser } from '../../_lib/auth.js';
import { clean, id, pagination, readJson } from '../../_lib/http.js';

export async function onRequestGet(context) {
  const auth = await requireUser(context);
  if (auth.error) return auth.error;
  const { u, limit, offset } = pagination(context.request.url);
  const q = `%${clean(u.searchParams.get('q'), 100) || ''}%`;
  const rows = await context.env.DB.prepare(`SELECT m.*,
    (SELECT COUNT(*) FROM service_tickets t WHERE t.machine_id=m.id) ticket_count,
    (SELECT COUNT(*) FROM service_tickets t WHERE t.machine_id=m.id AND t.status NOT IN ('resolved','closed')) open_ticket_count
    FROM machines m WHERE m.serial_no LIKE ? OR COALESCE(m.internal_code,'') LIKE ? OR m.model LIKE ? OR COALESCE(m.customer_name,'') LIKE ?
    ORDER BY m.updated_at DESC LIMIT ? OFFSET ?`).bind(q,q,q,q,limit,offset).all();
  return json({ machines: rows.results || [], limit, offset });
}

export async function onRequestPost(context) {
  const auth = await requireUser(context, ['admin', 'technical']);
  if (auth.error) return auth.error;
  const parsed = await readJson(context.request); if (parsed.error) return parsed.error;
  const b = parsed.body;
  const serial = clean(b.serialNo, 100), model = clean(b.model, 150);
  if (!serial || !model) return json({ error: 'serial_and_model_required' }, 400);
  const machineId = id('mac');
  try {
    await context.env.DB.prepare(`INSERT INTO machines
      (id,serial_no,internal_code,model,customer_name,customer_phone,location,cutting_head,controller,height_controller,laser_source,chiller,servo_brand,status,installed_at,warranty_until,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(machineId,serial,clean(b.internalCode,100),model,clean(b.customerName,200),clean(b.customerPhone,50),clean(b.location,300),clean(b.cuttingHead,100),clean(b.controller,100),clean(b.heightController,100),clean(b.laserSource,100),clean(b.chiller,100),clean(b.servoBrand,100),clean(b.status,30)||'active',clean(b.installedAt,30),clean(b.warrantyUntil,30),clean(b.notes,4000)).run();
  } catch (e) { return json({ error: String(e).includes('UNIQUE') ? 'machine_code_exists' : 'machine_create_failed' }, 409); }
  const token = crypto.randomUUID().replaceAll('-', '');
  await context.env.DB.prepare('INSERT INTO machine_qr_tokens (machine_id,token,created_by) VALUES (?,?,?)').bind(machineId,token,auth.user.id).run();
  return json({ id: machineId, qrToken: token, qrUrl: `/?qr=${token}` }, 201);
}
