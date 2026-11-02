const { send, cors, originAllowed, requireSession } = require("../lib/security");
const { listCapabilities } = require("../lib/capabilities");
module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" }, { Allow: "GET, OPTIONS" });
  if (!requireSession(req, res)) return;
  return send(res, 200, { capabilities: listCapabilities() });
};
