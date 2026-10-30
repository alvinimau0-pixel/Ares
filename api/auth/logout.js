const { send, cors, originAllowed } = require("../_lib/security");
module.exports = function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  res.setHeader("Set-Cookie", "ares_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
  return send(res, 200, { ok: true });
};
