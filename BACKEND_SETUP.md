# Ares backend foundation

This repository now includes Vercel serverless API routes. The frontend stays static; secrets stay on the server.

## API routes

- `GET /api/health` — reports which integrations have server-side configuration (not upstream availability).
- `POST /api/auth/login` — creates an 8-hour HttpOnly, Secure, SameSite=Strict session.
- `GET /api/auth/session` — checks the session.
- `POST /api/auth/logout` — clears the session.
- `POST /api/voice-token` — authenticated server-side ElevenLabs signed-URL exchange.
- `POST /api/chat` — authenticated Vercel AI Gateway Chat Completions proxy.
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
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API key |
| `AI_GATEWAY_MODEL` | Exact model ID available to the Gateway team |
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

- Chat uses non-streaming Chat Completions; tool calling and model failover are not wired yet.
- Voice-token route is ready, but the ElevenLabs widget must be switched to signed-session startup before enabling mandatory agent auth.
- Memory routes are ready after a dedicated Supabase project and owner are provisioned.
- n8n execution and Obsidian access are intentionally not proxied until their private endpoints and credentials are configured.
