# ARES Tool Integration & Permission Engine Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** Add a secure connector catalogue, a real read-only GitHub repository connector, and a permission policy endpoint that blocks unapproved write or destructive operations.

**Architecture:** Define a server-side connector/policy registry. Authenticated APIs expose safe capability metadata, fetch files only from the fixed ARES repository using a server-side GitHub token, and evaluate proposed actions against an explicit allowlist. The frontend presents connector status, a repository file reader and policy decisions. No write operation is executed in this phase.

**Tech Stack:** Existing static frontend, Node serverless functions, existing origin/session helpers, GitHub REST API.

**Spec:** ARES Phase 6 continuation; project constraints.

## Global Constraints
- All APIs require origin validation and owner session.
- GitHub access is read-only and restricted to alvinimau0-pixel/Ares.
- GitHub token is server-side only; no secrets in frontend or responses.
- Only allowlisted repository paths and refs may be read.
- Write, deploy, delete, external-account and credential operations are approval-required or blocked; no executor for them exists.
- Never claim a proposed action has been executed.
- Do not change production, merge branches, or deploy.

## Review Focus
- Missing GitHub token: report connector as not configured, not connected.
- Path traversal, encoded paths, unsupported ref and oversized file: reject.
- Unknown action or connector: reject.
- Write/delete/deploy: return approval-required/blocked without executing.
- Unauthenticated or disallowed-origin request: reject.

---

### Task 1: Connector and permission registry

**Files:** Create lib/capabilities.js
- [ ] Define GitHub read-only connector and explicit future capability policy.
- [ ] Expose sanitized catalogue and policy evaluator.

### Task 2: Authenticated APIs

**Files:** Create api/capabilities.js, api/github-read.js, api/permission-check.js
- [ ] Add authenticated GET catalogue.
- [ ] Add strict read-only GitHub contents fetch using server-side token and fixed repository.
- [ ] Add authenticated POST policy evaluation; never execute actions.

### Task 3: Frontend and docs

**Files:** Modify index.html, README.md
- [ ] Replace Plugins placeholder with capability cards, GitHub file reader and permission check UI.
- [ ] Render results using textContent.
- [ ] Document token setup and read-only / approval boundaries.

### Task 4: Verification
- [ ] Run syntax and source checks.
- [ ] Test policy outcomes and path validation locally from extracted pure functions.
- [ ] Confirm Phase 5 files remain unchanged; no merge/deployment.
