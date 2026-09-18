import QRCode from 'qrcode';
import { json, requireUser } from '../../../_lib/auth.js';

export async function onRequestGet(context){
 const auth=await requireUser(context);if(auth.error)return auth.error;
 const row=await context.env.DB.prepare(`SELECT q.token FROM machine_qr_tokens q WHERE q.machine_id=?`).bind(context.params.id).first();if(!row)return json({error:'qr_not_found'},404);
 const origin=new URL(context.request.url).origin;const target=`${origin}/?qr=${encodeURIComponent(row.token)}`;
 const svg=await QRCode.toString(target,{type:'svg',errorCorrectionLevel:'M',margin:2,width:640,color:{dark:'#111111',light:'#ffffff'}});
 return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'private, max-age=300','content-disposition':`inline; filename="PKLASER-${context.params.id}.svg"`}});
}
