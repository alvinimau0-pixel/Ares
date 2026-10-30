const { send, cors, originAllowed, requireSession } = require("./_lib/security");

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
  if (!requireSession(req, res)) return;
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID || "agent_9201m66px83rf829cx5yj829qrj6";
  if (!key) return send(res, 503, { error: "ElevenLabs server key is not configured in Vercel.", code: "VOICE_NOT_CONFIGURED" });
  try {
    const upstream = await fetch("https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=" + encodeURIComponent(agentId), {
      headers: { "xi-api-key": key }, cache: "no-store"
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return send(res, upstream.status === 401 ? 502 : upstream.status, { error: "ElevenLabs could not issue a session.", detail: data.detail?.message || data.detail || data.error || "Upstream request failed" });
    if (!data.signed_url) return send(res, 502, { error: "ElevenLabs returned no signed session URL." });
    return send(res, 200, { signedUrl: data.signed_url });
  } catch {
    return send(res, 502, { error: "Unable to reach ElevenLabs." });
  }
};
