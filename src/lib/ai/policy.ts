import type { AgentAction, AgentRisk, AgentPlanStep } from "./contracts";

export type AgentPolicyDecision =
  | { allowed: true; requiresHumanApproval: false; reason: string }
  | { allowed: true; requiresHumanApproval: true; reason: string }
  | { allowed: false; requiresHumanApproval: true; reason: string };

export interface AgentPolicyContext {
  environment: "local" | "preview" | "production";
  humanApprovalRecorded: boolean;
  taskRisk: AgentRisk;
}

const APPROVAL_REQUIRED_ACTIONS = new Set<AgentAction>([
  "write_internal", "send_external", "mutate_shared_database", "deploy_production",
]);

/**
 * Pure policy check only: this function does not execute tools or grant credentials.
 * Callers must enforce the returned decision at the actual tool boundary.
 */
export function evaluateAgentAction(
  step: Pick<AgentPlanStep, "action" | "toolName">,
  context: AgentPolicyContext,
): AgentPolicyDecision {
  if (step.action === "deploy_production") {
    return {
      allowed: false,
      requiresHumanApproval: true,
      reason: "Production deployment is blocked by default; use the established release process and separate explicit authorization.",
    };
  }

  if (step.action === "mutate_shared_database" && context.environment !== "local") {
    if (!context.humanApprovalRecorded) {
      return {
        allowed: false,
        requiresHumanApproval: true,
        reason: "Shared database mutations require explicit recorded approval, verified backup/restore, and an approved migration plan.",
      };
    }
    return {
      allowed: true,
      requiresHumanApproval: true,
      reason: "Approval is recorded; the caller must still verify target, backup/restore evidence, migration review, and rollback plan.",
    };
  }

  if (APPROVAL_REQUIRED_ACTIONS.has(step.action) && !context.humanApprovalRecorded) {
    return {
      allowed: false,
      requiresHumanApproval: true,
      reason: "This action can change internal state or affect people outside the system; explicit human approval is required.",
    };
  }

  if (context.taskRisk === "critical" && step.action !== "read") {
    return {
      allowed: false,
      requiresHumanApproval: true,
      reason: "Critical-risk tasks are restricted to read-only analysis until a separately reviewed workflow is implemented.",
    };
  }

  return {
    allowed: true,
    requiresHumanApproval: false,
    reason: "Read-only or draft action is allowed by this policy check; normal authentication, authorization, validation, and audit logging still apply.",
  };
}
