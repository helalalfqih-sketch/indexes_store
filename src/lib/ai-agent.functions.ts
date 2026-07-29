// Legacy exports remain available for non-P0 features.
// Security-critical approval, role resolution, and execution exports are
// explicitly overridden by the fail-closed trust implementation.
export * from "./ai-agent.legacy";
export {
  approveAgentTask,
  executeApprovedTask,
  getAdminDb,
  getAgentDb,
  getAgentRole,
  resolveAgentRole,
  startExecutionTask,
  verifyApproval,
  type AgentDb,
} from "./ai-agent-trust.functions";
