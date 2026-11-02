const http = require("node:http");
const { readConfig } = require("./config");
const { chatWithHermes } = require("./hermes-client");
const { classifyWithJev } = require("./jev");

const config = readConfig();
const allowedHosts = new Set([
  "127.0.0.1:" + config.port,
  "localhost:" + config.port,
  "[::1]:" + config.port
]);
function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(body));
}
function readBody(req) {
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
const server = http.createServer(async (req, res) => {
  if (!allowedHosts.has(req.headers.host || "")) return send(res, 403, { error: "Host header not allowed." });
  if (req.headers.origin && req.headers.origin !== "http://127.0.0.1:" + config.port && req.headers.origin !== "http://localhost:" + config.port) {
    return send(res, 403, { error: "Cross-origin requests are not allowed." });
  }
  if (req.method === "GET" && req.url === "/local-api/health") {
    return send(res, 200, {
      runtime: "ARES Local Runtime",
      status: "online",
      engine: { name: "Hermes Agent", endpoint: config.hermesUrl, keyConfigured: Boolean(config.hermesApiKey) },
      brains: Object.fromEntries(Object.entries(config.brains).map(([id, brain]) => [id, { label: brain.label, provider: brain.provider, configured: brain.configured }])),
      jev: { provider: "TypeSafe JEV", configured: config.jevConfigured }
    });
  }
  if (req.method === "POST" && req.url === "/local-api/chat") {
    try {
      const body = await readBody(req);
      return send(res, 200, await chatWithHermes(body, config));
    } catch (error) {
      return send(res, error.statusCode || 502, { error: error.message || "Local chat failed." });
    }
  }
  if (req.method === "POST" && req.url === "/local-api/jev/classify") {
    try {
      const state = await readBody(req);
      if (JSON.stringify(state).length > 8000) return send(res, 413, { error: "JEV input exceeds 8 KB." });
      return send(res, 200, await classifyWithJev(state));
    } catch (error) {
      return send(res, 502, { error: error.message || "JEV classification failed." });
    }
  }
  return send(res, 404, { error: "Not found." });
});
server.listen(config.port, config.host, () => {
  process.stdout.write("ARES local runtime listening at http://" + config.host + ":" + config.port + "\n");
});
