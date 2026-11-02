const DEFAULTS = Object.freeze({
  host: "127.0.0.1",
  port: 8787,
  hermesUrl: "http://127.0.0.1:8642",
  requestTimeoutMs: 60000,
  maxBodyBytes: 32768,
  brains: {
    claude: { envPrefix: "BRAIN_A", label: "Brain A · Claude", defaultProvider: "anthropic" },
    chatgpt: { envPrefix: "BRAIN_B", label: "Brain B · ChatGPT", defaultProvider: "openai" }
  }
});
function readConfig(env = process.env) {
  const host = env.ARES_LOCAL_HOST || DEFAULTS.host;
  if (host !== "127.0.0.1" && host !== "::1" && host !== "localhost") {
    throw new Error("ARES local runtime must bind to loopback only.");
  }
  const port = Number(env.ARES_LOCAL_PORT || DEFAULTS.port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("ARES_LOCAL_PORT must be an integer from 1024 to 65535.");
  const hermesUrl = String(env.HERMES_API_URL || DEFAULTS.hermesUrl).replace(/\/$/, "");
  const parsed = new URL(hermesUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("HERMES_API_URL must use HTTP or HTTPS.");
  const brains = {};
  for (const [id, base] of Object.entries(DEFAULTS.brains)) {
    const provider = String(env[base.envPrefix + "_PROVIDER"] || base.defaultProvider).trim();
    const model = String(env[base.envPrefix + "_MODEL"] || "").trim();
    if (provider.length > 80 || !/^[a-zA-Z0-9._-]+$/.test(provider)) throw new Error("Invalid provider for " + id);
    if (model.length > 180 || (model && !/^[a-zA-Z0-9._:/-]+$/.test(model))) throw new Error("Invalid model for " + id);
    brains[id] = { label: base.label, provider, model, configured: Boolean(model) };
  }
  return {
    host, port, hermesUrl, requestTimeoutMs: DEFAULTS.requestTimeoutMs,
    maxBodyBytes: DEFAULTS.maxBodyBytes,
    hermesApiKey: env.HERMES_API_KEY || "",
    brains,
    jevConfigured: Boolean(env.TYPESAFE_API_KEY)
  };
}
module.exports = { DEFAULTS, readConfig };
