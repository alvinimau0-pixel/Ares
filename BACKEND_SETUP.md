# Ares backend foundation

This repository now includes Vercel serverless API routes. The frontend stays static; secrets stay on the server.

## API routes

- `GET /api/health` — reports which integrations have server-side configuration (not upstream availability).
- `POST /api/auth/login` — creates an 8-hour HttpOnly, Secure, SameSite=Strict session.
- `GET /api/auth/session` — checks the session.
- `POST /api/auth/logout` — clears the session.
- `POST /api/voice-token` — authenticated server-side ElevenLabs signed-URL exchange.
- `GET /api/models` — authenticated live AI Gateway language-model catalogue.
- `POST /api/chat` — authenticated Vercel AI Gateway Chat Completions proxy with selectable model IDs and a concise Ares system policy.
- `GET|POST /api/memory` — authenticated memory access via Supabase REST.

All mutating/integration routes validate the request origin and require the Ares session. No browser-side provider key is accepted.

## Vercel environment variables

Set these in Vercel Project → Settings → Environment Variables. Use **Sensitive/Encrypted** values for secrets. Do not paste keys into GitHub or browser storage.

| Variable | Purpose |
|---|---|
| `ARES_ADMIN_PASSWORD` | Strong Ares sign-in password |
| `ARES_SESSION_SECRET` | Random secret, at least 32 characters |
| `ELEVENLABS_API_KEY` | Server-only ElevenLabs API key |
| `ELEVENLABS_AGENT_ID` | Existing Ares agent ID |
| `AI_GATEWAY_API_KEY` | Optional AI Gateway API key for non-OIDC deployments |
| `AI_GATEWAY_MODEL` | Optional default exact model ID; the Settings panel can select from the live catalogue |
| `VERCEL_OIDC_TOKEN` | Automatically provided to eligible Vercel deployments; preferred over a static Gateway key |
| `SUPABASE_URL` | Dedicated Ares Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Dedicated Ares project service-role key; server only |
| `ARES_OWNER_ID` | UUID of the Ares owner in Supabase Auth |
| `N8N_BASE_URL`, `N8N_API_KEY` | Reserved for the next n8n API adapter |
| `OBSIDIAN_BRIDGE_URL`, `OBSIDIAN_BRIDGE_TOKEN` | Reserved for a private Obsidian bridge |

After setting variables, redeploy production. `/api/health` indicates whether the required variables exist; it does not expose their values.

## Supabase memory setup

A Supabase project already exists in the connected account, but it is named **TheCapitol** and is not assumed to belong to Ares. Do not reuse it. Create/select a dedicated Ares project, run `supabase/migrations/202610300001_create_ares_memories.sql`, create the owner Auth user, then set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `ARES_OWNER_ID` in Vercel.

The migration enables RLS and scopes authenticated-user access by `auth.uid()`. The Ares API uses the service role only behind the signed Ares session. Never expose the service-role key to the browser.

## Current limits

- Chat uses non-streaming Chat Completions, a live model catalogue, a selectable model, and a 900-token output ceiling. Tool calling, streaming, provider failover policy, and team spend budgets are not wired yet.
- Voice-token route is ready, but the ElevenLabs widget must be switched to signed-session startup before enabling mandatory agent auth.
- Memory routes are ready after a dedicated Supabase project and owner are provisioned.
- n8n execution and Obsidian access are intentionally not proxied until their private endpoints and credentials are configured.


## Netlify migration (separate deployment)

The `netlify-migration` branch adds a compatibility layer for the existing Vercel Node handlers. It keeps the original `api/` and `lib/` source modules in place and exposes matching Netlify Functions at the same `/api/*` paths. The static frontend remains at the repository root; no frontend redesign is part of this migration.

### Netlify build settings

- Base directory: repository root
- Publish directory: `.`
- Functions directory: `netlify/functions`
- Build command: leave blank (the frontend has no build step)

The `netlify.toml` file supplies these settings. Do not configure a Vercel build command on Netlify.

### Required Netlify function environment variables

Set these in the Netlify site's environment-variable settings and include the **Functions** scope. Do not put values in GitHub, source files, or chat.

| Variable | Required for |
|---|---|
| `ARES_ADMIN_PASSWORD` | Ares owner sign-in |
| `ARES_SESSION_SECRET` | Signed sessions; use a random value of at least 32 characters |
| `AI_GATEWAY_API_KEY` | AI Gateway authentication on Netlify (Vercel OIDC is not available here) |
| `AI_GATEWAY_MODEL` | Exact provider/model ID used as the default |
| `ELEVENLABS_API_KEY` | Voice signed-session endpoint |
| `ELEVENLABS_AGENT_ID` | Existing Ares ElevenLabs agent |

Optional memory variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `ARES_OWNER_ID`. Only configure these after provisioning a dedicated Ares Supabase project; do not reuse **TheCapitol**. n8n and Obsidian variables remain optional and their adapters are not implemented.

After setting or changing variables, create a new deploy so the functions receive the updated values. The health endpoint reports whether variables are configured, not whether upstream services are healthy.

### Validation and rollout

1. Keep the existing Vercel production deployment as the rollback target.
2. Deploy this branch to the Netlify site as a Deploy Preview or branch deploy first.
3. Verify `GET /api/health`, unauthenticated `GET /api/auth/session`, login/logout, then authenticated `GET /api/models`, `POST /api/chat`, and the voice-token route.
4. Verify cookies are HttpOnly, Secure and SameSite=Strict; verify invalid origins and unauthenticated integration calls are rejected.
5. Only after successful tests should the Netlify production branch be selected.

The current origin allowlist includes the primary Netlify site URL `https://ares-intelligence.netlify.app` and the existing Vercel URLs. Netlify deploy-preview hostnames are intentionally not trusted by default. Add a specific preview origin only if preview testing requires it and the origin is known.

### Migration limitations

This is a compatibility adapter, not yet a verified production deployment. The connector workflow has not executed a Netlify build or function invocation. Runtime compatibility, cookie behavior, deploy-preview routing, and all upstream integrations must be tested on a real Netlify deploy before switching traffic.
