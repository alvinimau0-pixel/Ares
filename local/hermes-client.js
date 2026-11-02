function validateChatBody(body, config) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Request body must be a JSON object.";
  if (!["claude", "chatgpt"].includes(body.brain)) return "Choose brain 'claude' or 'chatgpt'.";
  if (!config.brains[body.brain].configured) return "The selected brain is not configured yet.";
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 30) return "Send between 1 and 30 messages.";
  let total = 0;
  for (const message of body.messages) {
    if (!message || !["user", "assistant"].includes(message.role) || typeof message.content !== "string" || message.content.length > 12000) return "Invalid chat message.";
    total += message.content.length;
  }
  if (total > 24000) return "Combined message content exceeds the 24,000 character limit.";
  return "";
}
async function chatWithHermes(body, config, fetchImpl = fetch) {
  const error = validateChatBody(body, config);
  if (error) {
    const e = new Error(error);
    e.statusCode = 400;
    throw e;
  }
  if (!config.hermesApiKey) {
    const e = new Error("Hermes API key is not configured in the local environment.");
    e.statusCode = 503;
    throw e;
  }
  const brain = config.brains[body.brain];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  try {
    const response = await fetchImpl(config.hermesUrl + "/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: "Bearer " + config.hermesApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: brain.model,
        provider: brain.provider,
        messages: body.messages,
        temperature: 0.35,
        max_tokens: Math.min(Number(body.maxTokens) || 1200, 2000)
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const e = new Error(data.error?.message || "Hermes request failed (" + response.status + ").");
      e.statusCode = response.status >= 500 ? 502 : response.status;
      throw e;
    }
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) throw new Error("Hermes returned an empty response.");
    return { brain: body.brain, provider: brain.provider, model: data.model || brain.model, reply: reply.trim(), usage: data.usage || null };
  } catch (error) {
    if (error.name === "AbortError") {
      const e = new Error("Hermes request timed out.");
      e.statusCode = 504;
      throw e;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
module.exports = { validateChatBody, chatWithHermes };
