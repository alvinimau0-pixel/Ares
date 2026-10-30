const { send, cors, originAllowed, requireSession } = require("../lib/security");

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (!["GET", "POST"].includes(req.method)) return send(res, 405, { error: "Method not allowed" }, { Allow: "GET, POST, OPTIONS" });
  if (!requireSession(req, res)) return;
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const owner = process.env.ARES_OWNER_ID;
  if (!base || !key || !owner) return send(res, 503, { error: "Ares Memory is not configured. Connect a dedicated Supabase project and set its server-side environment variables.", code: "MEMORY_NOT_CONFIGURED" });
  const headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  try {
    if (req.method === "GET") {
      const url = base.replace(/\/$/, "") + "/rest/v1/ares_memories?select=id,title,content,tags,created_at,updated_at&user_id=eq." + encodeURIComponent(owner) + "&order=updated_at.desc&limit=100";
      const upstream = await fetch(url, { headers, cache: "no-store" });
      const rows = await upstream.json().catch(() => []);
      if (!upstream.ok) return send(res, upstream.status, { error: "Memory query failed." });
      return send(res, 200, { memories: rows });
    }
    const body = req.body || {};
    if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 180 || typeof body.content !== "string" || !body.content.trim() || body.content.length > 20000) return send(res, 400, { error: "A title and content are required (max 180 and 20,000 characters)." });
    const row = { user_id: owner, title: body.title.trim(), content: body.content.trim(), tags: Array.isArray(body.tags) ? body.tags.filter(x => typeof x === "string").slice(0, 12) : [] };
    const upstream = await fetch(base.replace(/\/$/, "") + "/rest/v1/ares_memories", { method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(row) });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return send(res, upstream.status, { error: "Memory could not be saved." });
    return send(res, 201, { memory: Array.isArray(data) ? data[0] : data });
  } catch {
    return send(res, 502, { error: "Unable to reach Ares Memory." });
  }
};
