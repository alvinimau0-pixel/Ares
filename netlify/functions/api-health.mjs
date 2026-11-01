import { createRequire } from "node:module";
import { runLegacyHandler } from "../lib/legacy-adapter.mjs";
const require = createRequire(import.meta.url);
const handler = require("../../api/health.js");
export default (request) => runLegacyHandler(handler, request);
export const config = { path: "/api/health" };
