const test = require("node:test");
const assert = require("node:assert/strict");
const { readConfig } = require("../local/config");
const { validateChatBody } = require("../local/hermes-client");
const { createServer } = require("../local/server");

test("local runtime binds loopback and accepts safe defaults", () => {
  const config = readConfig({});
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 8787);
  assert.equal(config.brains.claude.provider, "anthropic");
  assert.equal(config.brains.chatgpt.provider, "openai");
  assert.equal(config.brains.claude.configured, false);
});
test("refuses non-loopback bind addresses", () => {
  assert.throws(() => readConfig({ ARES_LOCAL_HOST: "0.0.0.0" }), /loopback only/);
});
test("refuses invalid port", () => {
  assert.throws(() => readConfig({ ARES_LOCAL_PORT: "80" }), /1024 to 65535/);
});
test("brain models configure independently", () => {
  const config = readConfig({ BRAIN_A_MODEL: "claude-model", BRAIN_B_MODEL: "gpt-model" });
  assert.equal(config.brains.claude.configured, true);
  assert.equal(config.brains.chatgpt.configured, true);
});
test("rejects invalid brain and malformed messages", () => {
  const config = readConfig({ BRAIN_A_MODEL: "claude-model" });
  assert.match(validateChatBody({ brain: "unknown", messages: [{ role: "user", content: "hi" }] }, config), /Choose brain/);
  assert.match(validateChatBody({ brain: "claude", messages: [{ role: "system", content: "hi" }] }, config), /Invalid chat message/);
});
test("does not silently route to another brain when one is unconfigured", () => {
  const config = readConfig({ BRAIN_B_MODEL: "gpt-model" });
  assert.match(validateChatBody({ brain: "claude", messages: [{ role: "user", content: "hi" }] }, config), /not configured/);
  assert.equal(validateChatBody({ brain: "chatgpt", messages: [{ role: "user", content: "hi" }] }, config), "");
});
test("rejects combined message content above 24,000 characters", () => {
  const config = readConfig({ BRAIN_A_MODEL: "claude-model" });
  const messages = [
    { role: "user", content: "x".repeat(9000) },
    { role: "assistant", content: "y".repeat(9000) },
    { role: "user", content: "z".repeat(9000) }
  ];
  assert.match(validateChatBody({ brain: "claude", messages }, config), /24,000/);
});

test("serves the local control room with restrictive security headers", async () => {
  const config = readConfig({});
  const server = createServer(config);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const response = await fetch("http://127.0.0.1:" + address.port + "/", { headers: { Host: "127.0.0.1:8787" } });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy"), /connect-src 'self'/);
    assert.match(html, /ARES Conversation/);
    assert.match(html, /local-api\/health/);
    assert.doesNotMatch(html, /\/api\/chat/);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test("health endpoint exposes model readiness but never secrets", async () => {
  const config = readConfig({ HERMES_API_KEY: "secret-test-value", BRAIN_A_MODEL: "claude-model" });
  const server = createServer(config);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    const response = await fetch("http://127.0.0.1:" + address.port + "/local-api/health", { headers: { Host: "127.0.0.1:8787" } });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.brains.claude.configured, true);
    assert.equal(data.engine.keyConfigured, true);
    assert.doesNotMatch(JSON.stringify(data), /secret-test-value/);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
