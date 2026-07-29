// Legacy exports remain available for non-P0 features.
// Security-critical approval, role resolution, and execution exports are
// explicitly overridden by the fail-closed trust implementation.
export * from "./ai-agent.legacy";
export {
  approveAgentTask,
  executeApprovedTask,
  getAgentRole,
  startExecutionTask,
  verifyApproval,
} from "./ai-agent-trust.functions";
export {
  getAdminDb,
  getAgentDb,
  resolveAgentRole,
  type ProjectSupabaseClient,
} from "./ai-agent-db";
