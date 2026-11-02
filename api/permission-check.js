const { send, cors, originAllowed, requireSession } = require("../lib/security");
const { evaluateAction } = require("../lib/capabilities");
module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
  if (!requireSession(req, res)) return;
  const action = typeof req.body?.action === "string" ? req.body.action : "";
  if (!action || action.length > 80) return send(res, 400, { error: "Provide a valid action identifier." });
  return send(res, 200, { action, ...evaluateAction(action), executed: false });
};
