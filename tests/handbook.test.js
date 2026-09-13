import test from 'node:test';
import assert from 'node:assert/strict';
import { positions } from '../public/handbook.js';
import { onRequestPost } from '../functions/api/tickets/index.js';
test('each of ten positions has steps, output, exception and implementation limits',()=>{
 assert.equal(positions.length,10);assert.equal(new Set(positions.map(p=>p.id)).size,10);
 for(const p of positions){assert.ok(p.steps.length>=4);for(const field of ['goal','account','output','exception','future'])assert.ok(p[field]?.length)}
});
test('sales cannot assign a ticket via a crafted API request',async()=>{
 const context={request:new Request('https://example.test/api/tickets',{method:'POST',headers:{cookie:'pk_session=test','content-type':'application/json'},body:JSON.stringify({machineId:'m1',issueDetail:'Test',assignedTo:'tech1'})}),env:{DB:{prepare(sql){return {bind(){return this},async first(){if(sql.includes('sessions'))return {id:'sales1',role:'sales',is_active:1};if(sql.includes('machines'))return {id:'m1'};throw Error('Unexpected query')},async run(){throw Error('Must not write')}}}}}};
 const result=await onRequestPost(context);assert.equal(result.status,403);assert.equal((await result.json()).error,'assignment_requires_admin');
});
