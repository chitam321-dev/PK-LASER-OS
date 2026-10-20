import { z } from "zod";

export const agentDomainSchema = z.enum([
  "executive", "sales", "service", "inventory", "marketing", "finance", "engineering",
]);
export const agentRiskSchema = z.enum(["low", "medium", "high", "critical"]);

export const agentTaskSchema = z.object({
  taskId: z.string().uuid(),
  domain: agentDomainSchema,
  objective: z.string().trim().min(1).max(2_000),
  context: z.record(z.string(), z.unknown()).default({}),
  constraints: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  risk: agentRiskSchema,
  requestedBy: z.string().trim().min(1).max(160),
  requestedAt: z.string().datetime(),
});

export const agentActionSchema = z.enum([
  "read", "draft", "write_internal", "send_external", "mutate_shared_database", "deploy_production",
]);

export const agentPlanStepSchema = z.object({
  stepId: z.string().min(1).max(80),
  objective: z.string().trim().min(1).max(500),
  action: agentActionSchema,
  toolName: z.string().trim().min(1).max(120),
  input: z.record(z.string(), z.unknown()).default({}),
  expectedEvidence: z.string().trim().min(1).max(500),
  dependsOn: z.array(z.string().min(1).max(80)).max(30).default([]),
});

export const agentPlanSchema = z.object({
  taskId: z.string().uuid(),
  summary: z.string().trim().min(1).max(2_000),
  assumptions: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  steps: z.array(agentPlanStepSchema).min(1).max(40),
  finalChecks: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
});

export type AgentTask = z.infer<typeof agentTaskSchema>;
export type AgentRisk = z.infer<typeof agentRiskSchema>;
export type AgentAction = z.infer<typeof agentActionSchema>;
export type AgentPlan = z.infer<typeof agentPlanSchema>;
export type AgentPlanStep = z.infer<typeof agentPlanStepSchema>;
