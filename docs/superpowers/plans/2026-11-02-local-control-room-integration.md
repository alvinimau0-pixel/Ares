# ARES Phase 8 — Local Control Room Integration

## Goal
Provide a local-first ARES control-room page served by the Phase 7 loopback runtime. The page exposes accurate readiness for Hermes, Brain A (Claude), Brain B (ChatGPT/OpenAI), and optional TypeSafe JEV, and routes chat only to the explicitly selected brain.

## Decisions
- Serve a dedicated local control-room page from `local/public/index.html`; do not load the legacy cloud UI because it calls cloud-only `/api/*` endpoints.
- Preserve ARES dark command-centre styling and existing navigation language, but keep the local interface generic. No Claude orb or ChatGPT galaxy interface.
- Use same-origin `/local-api/health`, `/local-api/chat`, and `/local-api/jev/classify` only.
- Keep conversations in page memory only; do not persist messages or credentials in browser storage.
- Report configured readiness separately from proven upstream connectivity. A successful chat response is the proof of an upstream route.
- Static serving is limited to the fixed local HTML file. No arbitrary file paths, directory listing, remote host binding, deployment, or main merge.

## Tasks
1. Add a responsive local control-room page with engine/brain/JEV status, explicit brain selector, chat history, send/clear controls, error handling, and no secret inputs.
2. Serve only `GET /` from the local runtime with restrictive security headers; retain the API routes and 404 behavior for all other paths.
3. Add automated Node tests for static route response, security headers, and health metadata secrecy where practical.
4. Update README with local URL, accurate status semantics, supported controls, and limitations.
5. Run syntax and test verification; review branch diff. Do not merge or deploy.

## Acceptance
- Opening `http://127.0.0.1:8787/` serves the ARES local control room.
- UI health refresh calls only the local health endpoint.
- Chat requests include the explicit `brain` value and message history; there is no cross-brain fallback.
- No browser-side key entry, storage, remote asset, or cloud API call is required.
- Hermes/JEV unavailability is displayed honestly; no simulated connected states.
