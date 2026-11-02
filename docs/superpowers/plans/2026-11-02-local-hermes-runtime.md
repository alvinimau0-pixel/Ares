# ARES Phase 7 — Local Hermes Runtime Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Make ARES runnable on the user's PC with Hermes as the local execution engine, two independently configurable model brains, and an optional JEV structured-routing adapter, while deferring brain-specific visual interfaces.

**Architecture:** Add a dependency-light local Node.js service bound only to 127.0.0.1. It serves a small local status page and proxies chat requests to Hermes Agent's documented OpenAI-compatible API, keeping the Hermes API key server-side. Brain A (Claude) and Brain B (ChatGPT/OpenAI) are selected by explicit local configuration and sent to Hermes as provider/model overrides. JEV (TypeSafe) is a separate optional structured decision adapter. No Claude orb or ChatGPT galaxy UI is built in this phase.

**Tech Stack:** Node.js 20+, built-in HTTP/fs modules, Hermes Agent local API server, optional @typesafe-ai/sdk.

**Spec:** ARES local-first direction, 2026-11-02.

## Global Constraints
- Local service binds to 127.0.0.1 only; never 0.0.0.0 by default.
- Hermes API credentials remain in local environment files and are never returned to the browser.
- Claude and ChatGPT model/provider IDs are independently configurable; no hard-coded paid model assumptions.
- Hermes is the execution/tool engine; this app does not reimplement shell, file, browser or skill execution.
- JEV is optional and used only for structured routing/classification.
- Brain-specific visual interfaces remain deferred.
- No automatic installation, OAuth login, API-key creation, deployment or production changes.
- Do not copy cloud/Vercel/Supabase secrets into local config.

## Review Focus
- Hermes unavailable or unauthorized: health reports degraded and chat returns a clear 503/502.
- Missing Brain A or Brain B config: only that brain is unavailable; other remains usable.
- Malformed request, excessive message size, invalid brain ID: reject before upstream call.
- Local origin/host exposure: reject non-loopback host binding and browser origins not on allowlist.
- JEV SDK/key missing: JEV reports unavailable; chat remains functional.

---

### Task 1: Local runtime core
**Files:** Create package.json, local/server.js, local/hermes-client.js, local/config.js
- [ ] Add built-in HTTP server on 127.0.0.1:8787.
- [ ] Add /local-api/health and /local-api/chat.
- [ ] Proxy chat to Hermes at 127.0.0.1:8642/v1/chat/completions with server-side bearer key.
- [ ] Enforce request size, brain allowlist and timeouts.

### Task 2: Brain provider configuration and JEV adapter
**Files:** Create local/brains.example.json, local/jev.js
- [ ] Configure Claude and ChatGPT provider/model independently through environment/config.
- [ ] Add optional TypeSafe JEV structured classifier using @typesafe-ai/sdk; fail closed when unconfigured.
- [ ] Never silently fall back from one brain to another.

### Task 3: Local setup and verification
**Files:** Create scripts/setup-local.ps1, scripts/setup-local.sh, test/local-runtime.test.js; Modify README.md
- [ ] Add explicit setup/check commands without silently installing Hermes or writing secrets.
- [ ] Add Node built-in tests for config, request validation, host binding and JEV availability behavior.
- [ ] Document Hermes installation and gateway enablement, provider setup, local start and security boundaries.
- [ ] Keep brain interfaces deferred.

### Task 4: Verification
- [ ] Run node --test and syntax checks.
- [ ] Confirm no keys are committed and server binds loopback only.
- [ ] Confirm Phase 6 branch is the base and production/main are unchanged.
