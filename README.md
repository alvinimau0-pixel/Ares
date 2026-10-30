# ARES — Jarvis Command Centre

A responsive, orb-centred AI Managing Director dashboard with a left navigation rail, integration status cards, quick actions, activity feed and a visual workflow canvas.

## Frontend
- Responsive dark command-centre UI.
- Animated blue/violet energy orb.
- GitHub, Vercel, ElevenLabs, Memory, Ears and Eye module panels.
- Chat and voice controls wired to secure backend endpoints.
- Browser speech input and local camera preview.

## Backend foundation
See [BACKEND_SETUP.md](BACKEND_SETUP.md) for deployment and environment setup.

- `GET /api/health` — integration configuration readiness.
- `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout` — secure owner session.
- `POST /api/chat` — Vercel AI Gateway proxy.
- `POST /api/voice-token` — ElevenLabs signed session URL.
- `GET|POST /api/memory` — Supabase-backed personal memory.
- `supabase/migrations/` — RLS-protected Ares memory schema.

## Deployment
Static frontend plus Vercel Node.js serverless functions. No build step is required. Vercel Git integration deploys commits on `main`.

## Security
Provider keys remain server-side. API routes validate origins and require an Ares HttpOnly session before calling private integrations. Supabase memory is owner-scoped; the service-role key must never be exposed to the browser.

## Integration status
The API foundation is committed. Live chat, voice, and persistent memory require the environment variables and dedicated Supabase project documented in [BACKEND_SETUP.md](BACKEND_SETUP.md). The existing Supabase project named **TheCapitol** is deliberately not reused.
