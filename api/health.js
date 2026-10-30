const { send, cors, originAllowed } = require("../lib/security");

module.exports = function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" }, { Allow: "GET, OPTIONS" });
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  const configured = {
    sessionAuth: Boolean(process.env.ARES_ADMIN_PASSWORD && process.env.ARES_SESSION_SECRET && process.env.ARES_SESSION_SECRET.length >= 32),
    elevenLabs: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID),
    aiGateway: Boolean(process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL),
    supabaseMemory: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.ARES_OWNER_ID),
    n8n: Boolean(process.env.N8N_BASE_URL && process.env.N8N_API_KEY),
    obsidian: Boolean(process.env.OBSIDIAN_BRIDGE_URL && process.env.OBSIDIAN_BRIDGE_TOKEN)
  };
  return send(res, 200, { service: "ares-api", status: "ok", configured, note: "Readiness reflects server-side environment configuration, not a live upstream health check." });
};
