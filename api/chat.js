const { send, cors, originAllowed, requireSession } = require("../lib/security");

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
  if (!requireSession(req, res)) return;
  const token = process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY;
  const model = String(req.body && req.body.model || process.env.AI_GATEWAY_MODEL || "");
  if (!token) return send(res, 503, { error: "AI Gateway authentication is not configured. Vercel OIDC or AI_GATEWAY_API_KEY is required.", code: "AI_NOT_CONFIGURED" });
  if (!model || model.length > 180 || !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._:-]+$/.test(model)) return send(res, 400, { error: "Choose a valid provider/model ID from the live model catalogue." });
  
  const messages = req.body && req.body.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 30) return send(res, 400, { error: "Send between 1 and 30 chat messages." });
  const clean = [{ role: "system", content: "You are Ares, the user’s practical personal AI Managing Director. Be concise, accurate, and action-oriented. Distinguish completed actions from plans. Never claim integrations are connected unless verified. Ask for approval before sensitive or irreversible actions. Never request passwords, API keys, or recovery codes. Keep answers efficient and avoid unnecessary token use." }];
  for (const m of messages) {
    if (!m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 12000) return send(res, 400, { error: "Invalid chat message." });
    clean.push({ role: m.role, content: m.content });
  }
  try {
    const upstream = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: clean, temperature: 0.4, max_tokens: 900 })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return send(res, upstream.status, { error: data.error?.message || "AI Gateway request failed." });
    return send(res, 200, { reply: data.choices?.[0]?.message?.content || "", usage: data.usage || null, model: data.model || model });
  } catch {
    return send(res, 502, { error: "Unable to reach Vercel AI Gateway." });
  }
};
