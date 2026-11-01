const ENV_KEYS = [
  "ARES_ADMIN_PASSWORD",
  "ARES_SESSION_SECRET",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_AGENT_ID",
  "AI_GATEWAY_API_KEY",
  "AI_GATEWAY_MODEL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ARES_OWNER_ID",
  "N8N_BASE_URL",
  "N8N_API_KEY",
  "OBSIDIAN_BRIDGE_URL",
  "OBSIDIAN_BRIDGE_TOKEN"
];

function loadNetlifyEnvironment() {
  // Existing Vercel handlers read process.env. Populate only their known
  // server-side keys from Netlify's runtime environment API.
  if (!globalThis.Netlify?.env?.get) return;
  for (const key of ENV_KEYS) {
    const value = Netlify.env.get(key);
    if (value !== undefined && value !== null) process.env[key] = value;
  }
}

export async function runLegacyHandler(handler, request) {
  loadNetlifyEnvironment();

  let body;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const raw = await request.text();
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
      }
    }
  }

  const headers = Object.fromEntries(request.headers.entries());
  const req = { method: request.method, headers, body, url: request.url };
  const responseHeaders = new Headers();
  let statusCode = 200;
  let responseBody = "";

  const res = {
    set statusCode(value) { statusCode = value; },
    get statusCode() { return statusCode; },
    setHeader(name, value) { responseHeaders.set(name, String(value)); },
    end(value = "") { responseBody = value == null ? "" : String(value); }
  };

  try {
    await handler(req, res);
    return new Response(responseBody, { status: statusCode, headers: responseHeaders });
  } catch {
    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}
