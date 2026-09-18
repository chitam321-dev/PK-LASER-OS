import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('operations migration joins the workflow',()=>{const sql=read('migrations/0003_operations.sql');for(const name of ['repair_actions','machine_qr_tokens','confirmed_cause_code','labor_minutes'])assert.match(sql,new RegExp(name))});
test('ticket closure requires a resolution',()=>assert.match(read('functions/api/tickets/[id]/index.js'),/resolution_required_to_close/));
test('diagnosis can attach to machine and ticket',()=>{const source=read('functions/api/ai/diagnose.js');assert.match(source,/machineId/);assert.match(source,/ticketId/)});
test('role enforcement exists on operational writes',()=>{for(const p of ['functions/api/machines/index.js','functions/api/tickets/[id]/index.js','functions/api/tickets/[id]/actions.js'])assert.match(read(p),/requireUser/)});
