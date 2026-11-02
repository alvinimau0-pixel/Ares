const SKILLS = {
  "project-plan": {
    id: "project-plan", name: "Project Planner", category: "Planning",
    description: "Turn an objective into milestones, work packages, dependencies and acceptance checks.",
    mode: "ai_drafting", inputLabel: "Project objective and constraints",
    instruction: "Create a practical project plan with objective, scope, assumptions, phases, work packages, dependencies, milestones, risks, acceptance criteria and immediate next actions. Do not invent dates, budgets or approvals."
  },
  "risk-review": {
    id: "risk-review", name: "Risk & Controls Review", category: "Quality",
    description: "Identify risks, likelihood, impact, controls, owners and residual exposure.",
    mode: "ai_drafting", inputLabel: "Work, project or decision to review",
    instruction: "Perform a structured risk review. State assumptions, list hazards or failure modes, likelihood and impact qualitatively, existing/required controls, owner role, residual risk and stop-work triggers. Do not invent site-specific facts."
  },
  "technical-review": {
    id: "technical-review", name: "Technical Reviewer", category: "Engineering",
    description: "Review a technical approach for gaps, reliability, safety and maintainability.",
    mode: "ai_drafting", inputLabel: "Technical proposal, design or issue",
    instruction: "Review the supplied technical material. Separate facts from assumptions, identify missing information, inconsistencies, safety/security implications, failure modes and test/inspection points. Give prioritized corrective recommendations. Do not claim formal engineering approval."
  },
  "meeting-summary": {
    id: "meeting-summary", name: "Meeting & Action Extractor", category: "Operations",
    description: "Convert notes into decisions, action owners, due dates and open questions.",
    mode: "ai_drafting", inputLabel: "Meeting notes or transcript",
    instruction: "Turn the supplied notes into a concise meeting record: purpose, key discussion, decisions, actions (owner and due date only when stated), blockers and open questions. Mark missing owners/dates as unassigned rather than guessing."
  },
  "calculator": {
    id: "calculator", name: "Safe Calculator", category: "Utility",
    description: "Evaluate basic arithmetic locally without sending the expression to an AI model.",
    mode: "local_deterministic", inputLabel: "Arithmetic expression",
    instruction: null
  }
};

function listSkills() {
  return Object.values(SKILLS).map(({ id, name, category, description, mode, inputLabel }) =>
    ({ id, name, category, description, mode, inputLabel }));
}
function getSkill(id) { return SKILLS[id] || null; }

module.exports = { listSkills, getSkill };
