const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { readConfig } = require("./config");
const { chatWithHermes } = require("./hermes-client");
const { classifyWithJev } = require("./jev");

const PUBLIC_INDEX = path.join(__dirname, "public", "index.html");
const SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};
function send(res, status, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function sendPage(res) {
  let html;
  try { html = fs.readFileSync(PUBLIC_INDEX, "utf8"); }
  catch { return send(res, 500, { error: "Local control room page is missing." }); }
  res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}
function readBody(req, config) {
  return new Promise((resolve, reject) => {
    let data = "", size = 0, rejected = false;
    req.on("data", chunk => {
      if (rejected) return;
      size += chunk.length;
      if (size > config.maxBodyBytes) {
        rejected = true;
        const error = new Error("Request body exceeds 32 KB.");
        error.statusCode = 413;
        reject(error);
        return;
      }
      data += chunk.toString("utf8");
    });
    req.on("end", () => {
      if (rejected) return;
      try { resolve(JSON.parse(data || "{}")); }
      catch { const error = new Error("Request body must be valid JSON."); error.statusCode = 400; reject(error); }
    });
    req.on("error", error => { if (!rejected) reject(error); });
  });
}
function createServer(config = readConfig()) {
  const allowedHosts = new Set([
    "127.0.0.1:" + config.port,
    "localhost:" + config.port,
    "[::1]:" + config.port
  ]);
  return http.createServer(async (req, res) => {
    if (!allowedHosts.has(req.headers.host || "")) return send(res, 403, { error: "Host header not allowed." });
    if (req.headers.origin && req.headers.origin !== "http://127.0.0.1:" + config.port && req.headers.origin !== "http://localhost:" + config.port) {
      return send(res, 403, { error: "Cross-origin requests are not allowed." });
    }
    if (req.method === "GET" && req.url === "/") return sendPage(res);
    if (req.method === "GET" && req.url === "/local-api/health") {
      return send(res, 200, {
        runtime: "ARES Local Runtime",
        status: "online",
        engine: { name: "Hermes Agent", endpoint: config.hermesUrl, keyConfigured: Boolean(config.hermesApiKey) },
        brains: Object.fromEntries(Object.entries(config.brains).map(([id, brain]) => [id, { label: brain.label, provider: brain.provider, model: brain.model || "", configured: brain.configured }])),
        jev: { provider: "TypeSafe JEV", keyConfigured: config.jevConfigured }
      });
    }
    if (req.method === "POST" && req.url === "/local-api/chat") {
      try {
        const body = await readBody(req, config);
        return send(res, 200, await chatWithHermes(body, config));
      } catch (error) {
        return send(res, error.statusCode || 502, { error: error.message || "Local chat failed." });
      }
    }
    if (req.method === "POST" && req.url === "/local-api/jev/classify") {
      try {
        const state = await readBody(req, config);
        if (JSON.stringify(state).length > 8000) return send(res, 413, { error: "JEV input exceeds 8 KB." });
        return send(res, 200, await classifyWithJev(state));
      } catch (error) {
        return send(res, error.statusCode || 502, { error: error.message || "JEV classification failed." });
      }
    }
    return send(res, 404, { error: "Not found." });
  });
}
if (require.main === module) {
  const config = readConfig();
  const server = createServer(config);
  server.listen(config.port, config.host, () => {
    process.stdout.write("ARES local control room listening at http://" + config.host + ":" + config.port + "\n");
  });
}
module.exports = { createServer };
