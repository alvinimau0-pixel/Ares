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

## Tool integrations and permission engine

The Plugins & MCP workspace is now the ARES Connector Registry.

### Available capabilities
- GitHub Repository Reader: authenticated read-only access to individual text files in the fixed repository alvinimau0-pixel/Ares. Configure a least-privilege server-side GITHUB_TOKEN with Contents: read. The connector is reported as not configured until that environment variable exists. Reads are capped at 64 KB.
- AI Gateway: model reasoning and drafting through the existing server-side gateway configuration.

### Permission policy
- Read-only file access and allowlisted AI skills/orchestration are allowed.
- File creation/update is approval-required but has no write executor in this phase.
- Deletion, deployment and credential management are blocked.
- External account actions are approval-required but no executor is connected.
- POST /api/permission-check evaluates a policy only. Its response always states executed: false.

All endpoints require the existing ARES owner session and allowed origin. GitHub tokens must be stored as server-side environment variables and must never be placed in frontend code, local storage, or chat messages. This phase does not connect arbitrary MCP servers, run shell commands, or change repository contents.

## Phase 7 — Local Hermes runtime

ARES is moving to a local-first execution architecture. The local runtime is a Node.js 20+ service that binds to loopback only at `127.0.0.1:8787`. It keeps the Hermes API key on the PC and forwards requests to the Hermes Agent API server at `127.0.0.1:8642`.

### Roles
- **Engine:** Hermes Agent owns tool execution, skills, memory and agent orchestration.
- **Brain A:** Claude provider/model, configured independently with `BRAIN_A_PROVIDER` and `BRAIN_A_MODEL`.
- **Brain B:** ChatGPT/OpenAI provider/model, configured independently with `BRAIN_B_PROVIDER` and `BRAIN_B_MODEL`.
- **JEV:** Optional TypeSafe structured classifier, enabled only when `TYPESAFE_API_KEY` and the optional `@typesafe-ai/sdk` package are available.
- **Brain interfaces:** Claude's orb and ChatGPT's galaxy are intentionally deferred; this phase does not implement either visual interface.

There is no automatic fallback between Brain A and Brain B. A missing model configuration makes only that brain unavailable.

### PC setup

1. Install Node.js 20+ and Hermes Agent using the official Hermes Desktop installer (Windows/macOS) or official platform instructions.
2. Configure Claude and ChatGPT/OpenAI providers in Hermes with `hermes model`. Use the provider and model IDs that Hermes lists for the accounts you actually have.
3. Enable Hermes' local API server in `~/.hermes/.env`:
   ```dotenv
   API_SERVER_ENABLED=true
   API_SERVER_HOST=127.0.0.1
   API_SERVER_PORT=8642
   API_SERVER_KEY=replace-with-a-long-random-local-secret
   ```
4. Start Hermes with `hermes gateway`. Confirm it listens on `http://127.0.0.1:8642`.
5. Set local environment variables in the same terminal before starting ARES:
   ```powershell
   $env:HERMES_API_KEY="same-secret-as-API_SERVER_KEY"
   $env:BRAIN_A_PROVIDER="anthropic"
   $env:BRAIN_A_MODEL="your-configured-claude-model"
   $env:BRAIN_B_PROVIDER="openai"
   $env:BRAIN_B_MODEL="your-configured-openai-model"
   npm run start:local
   ```
   On macOS/Linux, use `export NAME=value` for each variable.
6. Check `http://127.0.0.1:8787/local-api/health`.

### Local endpoints
- `GET /local-api/health` — readiness metadata; never returns secrets.
- `POST /local-api/chat` — body: `{ "brain": "claude" | "chatgpt", "messages": [...] }`.
- `POST /local-api/jev/classify` — optional JEV structured brain selection.

### JEV
Install the optional SDK with `npm install @typesafe-ai/sdk` and configure `TYPESAFE_API_KEY` in the local process environment to enable TypeSafe JEV. JEV is a separate structured decision service; it is not a third conversational brain and its inference is hosted by TypeSafe, not performed on the PC. The ARES bridge remains local, but a JEV decision requires internet access and a TypeSafe API key. If unavailable, ARES reports that status and chat continues to work with explicit brain selection.

### Security and current limits
- The local service refuses non-loopback bind addresses and unexpected Host/Origin headers.
- The Hermes key is never sent to browser code or included in API responses.
- Chat requests are size-limited, role-validated and restricted to the two configured brains.
- No automatic brain fallback, provider OAuth, software installation, shell execution from ARES, remote exposure or credential persistence is performed by the setup scripts.
- This phase provides the local API/runtime foundation only. The orb and galaxy interfaces are on hold as requested.
- The old cloud API routes remain in the repository for backward compatibility but are not the local execution engine.
