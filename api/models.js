const { send, cors, originAllowed, requireSession } = require("../lib/security");

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" }, { Allow: "GET, OPTIONS" });
  if (!requireSession(req, res)) return;
  const token = process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY;
  if (!token) return send(res, 503, { error: "AI Gateway authentication is not available. Configure Vercel OIDC or an AI Gateway API key.", code: "AI_AUTH_NOT_CONFIGURED" });
  try {
    const upstream = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      headers: { Authorization: "Bearer " + token }, cache: "no-store"
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return send(res, upstream.status, { error: data.error?.message || "Model catalogue request failed." });
    const list = Array.isArray(data.data) ? data.data : [];
    const models = list.filter(m => m.type === "language" || (m.modalities?.input || []).includes("text"))
      .map(m => ({
        id: m.id, name: m.name || m.id, description: m.description || "",
        contextWindow: m.context_window || null, maxTokens: m.max_tokens || null,
        inputPrice: m.pricing?.input || null, outputPrice: m.pricing?.output || null,
        tags: Array.isArray(m.tags) ? m.tags : [],
        input: m.modalities?.input || [], output: m.modalities?.output || [],
        zdr: m.zdr || "unknown", noTraining: m.no_training || "unknown"
      }));
    return send(res, 200, { models, configuredDefault: process.env.AI_GATEWAY_MODEL || null, count: models.length });
  } catch {
    return send(res, 502, { error: "Unable to retrieve the AI Gateway model catalogue." });
  }
};
