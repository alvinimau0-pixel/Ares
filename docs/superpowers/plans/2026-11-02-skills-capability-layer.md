# ARES Skills & Capability Layer Implementation Plan

> **For agentic workers:** Native implementation in this session; execute each task and verify before continuing.

**Goal:** Add a discoverable, authenticated skill registry and a bounded runner that can execute safe built-in skills without pretending external integrations are connected.

**Architecture:** Keep skill definitions in a shared server-side allowlist. Expose an authenticated read-only catalogue endpoint and a separate authenticated runner endpoint. Text skills use the existing AI Gateway; a calculator skill uses a small arithmetic parser with no eval. The Skills panel will render the catalogue and allow a user to run an approved skill.

**Tech Stack:** Existing static HTML/JS, Node serverless endpoints, existing session/origin helpers, AI Gateway.

**Spec:** ARES Phase 5 continuation request; project constraints in conversation context.

## Global Constraints
- All endpoints require origin validation and an ARES owner session.
- No arbitrary code, shell, filesystem, browser, network, or external-account execution.
- Skill IDs and instructions are server-side allowlisted; never accept user-defined code or prompts as system instructions.
- Text skills are reasoning/drafting only; calculator is deterministic local computation.
- Credentials remain server-side; no database or paid integration is required.
- Preserve Phase 4 orchestrator and manual specialist task flow.

## Review Focus
- Unknown skill IDs: reject before Gateway calls.
- Malformed/oversized input: reject with 400.
- Arithmetic injection or unsupported syntax: reject without evaluation.
- Gateway unavailable or empty response: return a clear failure.
- Unauthenticated or cross-origin requests: reject.

---

### Task 1: Shared skill registry and catalogue endpoint

**Files:**
- Create: `lib/skills.js`
- Create: `api/skills.js`

- [ ] Define a fixed catalogue with IDs, names, descriptions, categories, input labels and execution modes.
- [ ] Add authenticated GET catalogue endpoint.
- [ ] Do not expose prompts or secrets in catalogue output.

### Task 2: Secure skill runner

**Files:**
- Create: `api/skill-run.js`

- [ ] Validate method, origin, owner session, skill ID, input length and model.
- [ ] Implement safe arithmetic parser without eval.
- [ ] Route text skills through AI Gateway with fixed server-side instructions and bounded tokens/timeouts.
- [ ] Return execution mode and honest result status.

### Task 3: Skills workspace and documentation

**Files:**
- Modify: `index.html`
- Modify: `README.md`

- [ ] Replace placeholder Skills panel with catalogue, skill selector, input and result area.
- [ ] Load catalogue from authenticated endpoint and run via skill runner.
- [ ] Render all returned text via textContent.
- [ ] Document supported skills and capability limits.

### Task 4: Verification

- [ ] Run JavaScript syntax checks on all new endpoints and inline UI script.
- [ ] Verify authentication/origin gates, allowlist, no eval/Function, and Phase 4 files unchanged.
- [ ] Compare branch against Phase 4; do not merge or deploy.
