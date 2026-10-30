const { send, cors, originAllowed, requireSession } = require("./_lib/security");

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
  if (!requireSession(req, res)) return;
  const key = process.env.AI_GATEWAY_API_KEY;
  const model = process.env.AI_GATEWAY_MODEL;
  if (!key || !model) return send(res, 503, { error: "Vercel AI Gateway is not configured. Set AI_GATEWAY_API_KEY and AI_GATEWAY_MODEL.", code: "AI_NOT_CONFIGURED" });
  const messages = req.body && req.body.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 30) return send(res, 400, { error: "Send between 1 and 30 chat messages." });
  const clean = [];
  for (const m of messages) {
    if (!m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 12000) return send(res, 400, { error: "Invalid chat message." });
    clean.push({ role: m.role, content: m.content });
  }
  try {
    const upstream = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: clean, temperature: 0.4, max_tokens: 1200 })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return send(res, upstream.status, { error: data.error?.message || "AI Gateway request failed." });
    return send(res, 200, { reply: data.choices?.[0]?.message?.content || "", usage: data.usage || null, model: data.model || model });
  } catch {
    return send(res, 502, { error: "Unable to reach Vercel AI Gateway." });
  }
};
