const { send, cors, originAllowed, validSession } = require("../../lib/security");
module.exports = function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  return send(res, 200, { authenticated: validSession(req) });
};
