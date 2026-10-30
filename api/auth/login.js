const crypto = require("node:crypto");
const { send, cors, originAllowed, createSession } = require("../../lib/security");

module.exports = function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
  const password = process.env.ARES_ADMIN_PASSWORD;
  const secret = process.env.ARES_SESSION_SECRET;
  if (!password || !secret || secret.length < 32) return send(res, 503, { error: "Ares authentication is not configured yet.", code: "AUTH_NOT_CONFIGURED" });
  const supplied = String(req.body && req.body.password || "");
  if (!supplied || supplied.length > 512) return send(res, 400, { error: "Enter your Ares access password." });
  const a = Buffer.from(supplied);
  const b = Buffer.from(password);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return send(res, 401, { error: "Incorrect password." });
  const token = createSession(secret);
  res.setHeader("Set-Cookie", "ares_session=" + encodeURIComponent(token) + "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800");
  return send(res, 200, { ok: true, expiresIn: 28800 });
};
