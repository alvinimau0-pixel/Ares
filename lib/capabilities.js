const REPOSITORY = "alvinimau0-pixel/Ares";
const CONNECTORS = [
  {
    id: "github-readonly", name: "GitHub Repository Reader", category: "Development",
    description: "Read files from the ARES repository through a server-side GitHub token.",
    mode: "read_only", statusEnv: "GITHUB_TOKEN", allowedOperations: ["read_file"]
  },
  {
    id: "ai-gateway", name: "AI Gateway", category: "AI",
    description: "Route model requests through the configured server-side AI Gateway.",
    mode: "reasoning", statusEnv: "AI_GATEWAY_API_KEY", allowedOperations: ["chat", "run_skill", "orchestrate"]
  }
];
const POLICIES = {
  read_file: { decision: "allowed", approval: false, reason: "Read-only repository access is permitted within the configured repository and path rules." },
  chat: { decision: "allowed", approval: false, reason: "AI reasoning and drafting are permitted." },
  run_skill: { decision: "allowed", approval: false, reason: "Only allowlisted skills may run." },
  orchestrate: { decision: "allowed", approval: false, reason: "Bounded specialist reasoning and drafting are permitted." },
  create_or_update_file: { decision: "approval_required", approval: true, reason: "Repository writes require explicit owner approval and a separate write executor." },
  delete_file: { decision: "blocked", approval: true, reason: "Destructive deletion is not enabled in this phase." },
  deploy: { decision: "blocked", approval: true, reason: "Deployment is not enabled in this phase." },
  manage_credentials: { decision: "blocked", approval: true, reason: "Credential changes are not enabled through the ARES tool runner." },
  external_account_action: { decision: "approval_required", approval: true, reason: "External account actions require an approved connector and explicit confirmation." }
};
function listCapabilities() {
  return CONNECTORS.map(({ id, name, category, description, mode, statusEnv, allowedOperations }) => ({
    id, name, category, description, mode,
    status: process.env[statusEnv] ? "configured" : "not_configured",
    allowedOperations
  }));
}
function evaluateAction(action) {
  return POLICIES[action] || { decision: "blocked", approval: true, reason: "Unknown actions are blocked by default." };
}
function validateRepoPath(value) {
  if (typeof value !== "string" || !value || value.length > 180 || value.startsWith("/") ||
      value.includes("\\") || value.includes("%") || value.split("/").some(part => !part || part === "." || part === "..") ||
      !/^[a-zA-Z0-9._/-]+$/.test(value) || value.startsWith(".github/workflows/")) return false;
  return true;
}
function validateRef(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 100 &&
    /^[a-zA-Z0-9._/-]+$/.test(value) && !value.includes("..") && !value.startsWith("/");
}
module.exports = { REPOSITORY, listCapabilities, evaluateAction, validateRepoPath, validateRef };
