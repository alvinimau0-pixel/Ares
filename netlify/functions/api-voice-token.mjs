import { createRequire } from "node:module";
import { runLegacyHandler } from "../lib/legacy-adapter.mjs";
const require = createRequire(import.meta.url);
const handler = require("../../api/voice-token.js");
export default (request) => runLegacyHandler(handler, request);
export const config = { path: "/api/voice-token" };
