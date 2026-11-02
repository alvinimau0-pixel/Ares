const { send, cors, originAllowed, requireSession } = require("../lib/security");
const { REPOSITORY, validateRepoPath, validateRef, evaluateAction } = require("../lib/capabilities");

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!originAllowed(req)) return send(res, 403, { error: "Origin not allowed" });
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
  if (!requireSession(req, res)) return;
  const body = req.body || {};
  const path = body.path;
  const ref = body.ref || "main";
  if (!validateRepoPath(path)) return send(res, 400, { error: "Repository path is invalid or not permitted." });
  if (!validateRef(ref)) return send(res, 400, { error: "Git reference is invalid." });
  const token = process.env.GITHUB_TOKEN;
  if (!token) return send(res, 503, { error: "GitHub read-only connector is not configured.", code: "GITHUB_NOT_CONFIGURED" });
  try {
    const url = "https://api.github.com/repos/" + REPOSITORY + "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(ref);
    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return send(res, response.status === 404 ? 404 : response.status === 403 ? 403 : 502, { error: response.status === 404 ? "File not found in the ARES repository." : "GitHub read failed (" + response.status + ")." });
    if (data.type !== "file" || typeof data.content !== "string" || data.encoding !== "base64") {
      return send(res, 400, { error: "Only individual text files can be read." });
    }
    const buffer = Buffer.from(data.content.replace(/\s/g, ""), "base64");
    if (buffer.length > 65536) return send(res, 413, { error: "File exceeds the 64 KB read limit." });
    const content = buffer.toString("utf8");
    if (content.includes("\u0000")) return send(res, 415, { error: "Binary files are not supported." });
    return send(res, 200, { repository: REPOSITORY, path, ref, name: data.name, size: buffer.length, content, mode: evaluateAction("read_file").decision });
  } catch {
    return send(res, 502, { error: "Unable to reach GitHub." });
  }
};
module.exports.config = { maxDuration: 15 };
