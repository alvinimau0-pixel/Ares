import { createRequire } from "node:module";
import { runLegacyHandler } from "./_legacy-adapter.mjs";
const require = createRequire(import.meta.url);
const handler = require("../../api/models.js");
export default (request) => runLegacyHandler(handler, request);
export const config = { path: "/api/models" };
