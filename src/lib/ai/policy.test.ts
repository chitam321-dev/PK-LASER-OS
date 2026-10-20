import assert from "node:assert/strict";
import test from "node:test";
import { agentPlanSchema, agentTaskSchema } from "./contracts";
import { evaluateAgentAction } from "./policy";

const action = (value: "read" | "draft" | "write_internal" | "send_external" | "mutate_shared_database" | "deploy_production") => ({
  action: value,
  toolName: "test-tool",
});

const baseContext = {
  environment: "preview" as const,
  humanApprovalRecorded: false,
  taskRisk: "low" as const,
};

test("agent task schema rejects malformed task identifiers", () => {
  const result = agentTaskSchema.safeParse({
    taskId: "not-a-uuid",
    domain: "service",
    objective: "Diagnose a machine fault",
    risk: "low",
    requestedBy: "technician",
    requestedAt: new Date().toISOString(),
  });
  assert.equal(result.success, false);
});

test("agent plan schema requires at least one final check", () => {
  const result = agentPlanSchema.safeParse({
    taskId: "11111111-1111-4111-8111-111111111111",
    summary: "Read-only analysis",
    steps: [{
      stepId: "step-1",
      objective: "Read approved documentation",
      action: "read",
      toolName: "knowledge.search",
      input: {},
      expectedEvidence: "Source references",
      dependsOn: [],
    }],
    finalChecks: [],
  });
  assert.equal(result.success, false);
});

test("read and draft actions are allowed without side effects", () => {
  assert.equal(evaluateAgentAction(action("read"), baseContext).allowed, true);
  assert.equal(evaluateAgentAction(action("draft"), baseContext).allowed, true);
});

test("external sends fail closed without recorded approval", () => {
  const decision = evaluateAgentAction(action("send_external"), baseContext);
  assert.equal(decision.allowed, false);
  assert.equal(decision.requiresHumanApproval, true);
});

test("production deployment is always blocked by this helper", () => {
  const decision = evaluateAgentAction(action("deploy_production"), {
    ...baseContext,
    environment: "production",
    humanApprovalRecorded: true,
  });
  assert.equal(decision.allowed, false);
});

test("critical-risk tasks cannot draft or write", () => {
  const decision = evaluateAgentAction(action("draft"), {
    ...baseContext,
    taskRisk: "critical",
  });
  assert.equal(decision.allowed, false);
});

test("shared database mutation is blocked without approval in preview", () => {
  const decision = evaluateAgentAction(action("mutate_shared_database"), baseContext);
  assert.equal(decision.allowed, false);
});
