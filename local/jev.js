async function classifyWithJev(state) {
  if (!process.env.TYPESAFE_API_KEY) return { available: false, reason: "TYPESAFE_API_KEY is not configured." };
  let TypeSafeClient, choice;
  try {
    ({ TypeSafeClient, choice } = require("@typesafe-ai/sdk"));
  } catch {
    return { available: false, reason: "Install the optional @typesafe-ai/sdk package to enable JEV." };
  }
  const client = new TypeSafeClient();
  const result = await client.systemOne({
    state,
    questions: {
      brain: choice("Which configured ARES brain should handle this request?", {
        claude: null,
        chatgpt: null
      })
    }
  });
  const selected = result?.answers?.brain?.choice;
  if (!["claude", "chatgpt"].includes(selected)) throw new Error("JEV returned an unsupported brain decision.");
  return { available: true, brain: selected };
}
module.exports = { classifyWithJev };
