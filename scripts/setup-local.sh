#!/usr/bin/env bash
set -euo pipefail
echo "ARES Local Runtime preflight"
command -v node >/dev/null 2>&1 || { echo "Node.js 20+ is required."; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 20) process.exit(1)' || { echo "Node.js 20+ is required."; exit 1; }
if command -v hermes >/dev/null 2>&1; then echo "Hermes CLI: detected"; else echo "Hermes CLI not detected. Install Hermes Desktop or use the official Hermes installation guide."; fi
echo "Preflight complete. No software or credentials were installed or written."
echo "Configure Hermes API server and local environment variables, then run npm run start:local."
