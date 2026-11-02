# ARES Autonomous Orchestrator Implementation Plan

> **For agentic workers:** Native implementation in this session; execute each task and verify before continuing.

**Goal:** Turn the Phase 3 specialist roster into a bounded, authenticated multi-step AI orchestration flow that plans, delegates, reviews, and consolidates work.

**Architecture:** Add a dedicated serverless endpoint that asks ARES for a constrained JSON plan, validates a maximum of three specialist assignments against a fixed role allowlist, executes them sequentially through the existing AI Gateway, and makes one final synthesis call. Extend the existing workforce panel with an orchestration form and safe text-only task timeline.

**Tech Stack:** Existing static HTML/CSS/JavaScript, Node.js serverless functions, existing session/origin helpers, AI Gateway Chat Completions API.

**Spec:** Phase 4 continuation request and ARES project constraints in conversation context.

## Global Constraints
- Keep all provider credentials server-side.
- Require the existing owner session and origin allowlist.
- No external tools, file mutation, account actions, or production deployment.
- Limit one objective to three specialist calls plus plan and synthesis calls.
- Never trust model-generated roles or instructions outside the fixed allowlist.
- Preserve existing Phase 3 manual specialist task flow.
- Report orchestration as reasoning/drafting only; approval required for sensitive or irreversible actions.

## Review Focus
- Malformed planner JSON or unexpected role IDs: reject or safely fall back without executing arbitrary roles.
- Empty/overlong objective: reject before any model call.
- Upstream rate limits, timeout, or partial specialist failure: return partial results with explicit status.
- Prompt injection in user objective or specialist outputs: treat as untrusted task content and retain system constraints.
- Large outputs: cap per-call tokens and overall specialist count.

---

### Task 1: Secure orchestration API

**Files:**
- Create: `api/orchestrate.js`

**Interfaces:**
- Consumes: `../lib/security` helpers and AI Gateway credentials/model configuration.
- Produces: `POST /api/orchestrate` accepting `{ objective, model? }`, returning validated plan, specialist results, and synthesis.

- [ ] Validate method, origin, owner session, objective length, model ID, and Gateway credentials.
- [ ] Plan with fixed role allowlist and JSON-only response.
- [ ] Validate and cap assignments to three; run specialist calls sequentially.
- [ ] Synthesize successful outputs; expose partial failures honestly.
- [ ] Keep token caps and avoid external side effects.

### Task 2: Workforce orchestration UI

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `POST /api/orchestrate`.
- Produces: objective form, live progress text, plan/task cards, consolidated output.

- [ ] Add an ARES orchestration form without removing manual specialist assignment.
- [ ] Bind submit with progress states and safe `textContent` rendering.
- [ ] Display plan, assigned roles, outcomes, partial failures, and final synthesis.
- [ ] Preserve mobile layout and session-only history.

### Task 3: Documentation and verification

**Files:**
- Modify: `README.md`

- [ ] Document the endpoint and its limits.
- [ ] Run source-level syntax and contract checks where available.
- [ ] Confirm only the Phase 4 branch changed; do not deploy or merge.
