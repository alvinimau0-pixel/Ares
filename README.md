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
- `POST /api/agent-task` — authenticated single-specialist task execution.
- `POST /api/orchestrate` — bounded ARES planning, sequential specialist delegation (up to three), and final synthesis.
- `POST /api/voice-token` — ElevenLabs signed session URL.
- `GET|POST /api/memory` — Supabase-backed personal memory.
- `supabase/migrations/` — RLS-protected Ares memory schema.

## Deployment
Static frontend plus Vercel Node.js serverless functions. No build step is required. Vercel Git integration deploys commits on `main`.

## Security
Provider keys remain server-side. API routes validate origins and require an Ares HttpOnly session before calling private integrations. Supabase memory is owner-scoped; the service-role key must never be exposed to the browser.

## Integration status
The API foundation is committed. Live chat, voice, and persistent memory require the environment variables and dedicated Supabase project documented in [BACKEND_SETUP.md](BACKEND_SETUP.md). The existing Supabase project named **TheCapitol** is deliberately not reused.


## ARES orchestration limits

The AI Workforce panel supports both manual specialist assignments and an ARES mission flow. Orchestration plans with a fixed role allowlist, runs up to three specialist calls sequentially, and synthesizes successful findings. This is AI reasoning and drafting only: it does not run shell commands, modify files, call connected accounts, or execute external workflows. Results are session-only in the browser. Owner authentication and AI Gateway configuration are required.

## ARES skills and capability layer

The authenticated Skills panel reads the allowlisted catalogue from `GET /api/skills` and runs a selected skill through `POST /api/skill-run`.

Built-in skills:
- Project Planner — AI-assisted planning and drafting.
- Risk & Controls Review — qualitative risk review and controls.
- Technical Reviewer — technical gap and quality review.
- Meeting & Action Extractor — structured notes and action extraction.
- Safe Calculator — deterministic arithmetic evaluated locally without `eval` or an AI call.

All skill endpoints require the existing owner session and origin checks. AI skills require configured AI Gateway authentication. The runner does not execute arbitrary code, shell commands, filesystem changes, external network requests, or connected-account actions. Tool connectors must be added as separate explicit allowlisted capabilities with their own permission and approval policies.
