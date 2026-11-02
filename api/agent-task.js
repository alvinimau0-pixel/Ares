const { send, cors, originAllowed, requireSession } = require("../lib/security");

const AGENTS = {
  ares: {
    name: "ARES Managing Director",
    instruction: "Act as ARES, the Managing Director. Clarify the objective internally, structure the work, identify dependencies and risks, then provide a concise executive recommendation and next actions."
  },
  engineer: {
    name: "ENGINEER",
    instruction: "Act as a senior software and systems engineer. Focus on architecture, implementation details, debugging, security, maintainability and testable technical steps. Do not claim code was changed or executed."
  },
  researcher: {
    name: "RESEARCHER",
    instruction: "Act as a rigorous research analyst. Separate established facts from assumptions, identify evidence gaps, compare options and present a structured, balanced conclusion. Do not invent sources."
  },
  operations: {
    name: "OPERATIONS",
    instruction: "Act as an operations and project-delivery specialist. Convert objectives into practical work packages, owners, dependencies, milestones, checklists and risks. Make schedules realistic."
  },
  designer: {
    name: "DESIGNER",
    instruction: "Act as a senior product and UX designer. Focus on user journeys, information architecture, interaction design, accessibility, responsive behaviour and visual consistency. Give concrete recommendations."
  },
  analyst: {
    name: "ANALYST",
    instruction: "Act as a data and quality analyst. Validate assumptions, explain calculations, identify anomalies and uncertainty, and recommend measurable checks. Never fabricate data."
  }
};

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
  if (!requireSession(req, res)) return;

  const body = req.body || {};
  const agentId = typeof body.agent === "string" ? body.agent : "";
  const task = typeof body.task === "string" ? body.task.trim() : "";
  const agent = AGENTS[agentId];
  if (!agent) return send(res, 400, { error: "Choose a valid ARES specialist." });
  if (!task || task.length > 10000) return send(res, 400, { error: "Task brief must contain between 1 and 10000 characters." });

  const token = process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY;
  const model = String(body.model || process.env.AI_GATEWAY_MODEL || "");
  if (!token) return send(res, 503, { error: "AI Gateway authentication is not configured.", code: "AI_NOT_CONFIGURED" });
  if (!model || model.length > 180 || !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._:-]+$/.test(model)) {
    return send(res, 400, { error: "Choose a valid provider/model ID from the live model catalogue." });
  }

  try {
    const upstream = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are " + agent.name + ", a specialist in the ARES AI workforce. " + agent.instruction + " Be concise, actionable and honest. You can reason and draft outputs only. You do not have access to external tools, files, accounts or execution systems. Never claim to have performed actions. Ask for approval before sensitive or irreversible actions. Never request passwords, API keys or recovery codes." },
          { role: "user", content: task }
        ],
        temperature: 0.3,
        max_tokens: 1100
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return send(res, upstream.status, { error: data.error?.message || "AI Gateway request failed." });
    const result = data.choices?.[0]?.message?.content || "";
    if (!result.trim()) return send(res, 502, { error: "Specialist returned an empty response." });
    return send(res, 200, { agent: agentId, name: agent.name, result, model: data.model || model, usage: data.usage || null });
  } catch {
    return send(res, 502, { error: "Unable to reach AI Gateway." });
  }
};
