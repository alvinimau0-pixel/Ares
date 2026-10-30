# ARES — Personal Intelligence Interface

Orb-first, dark-mode control room frontend for the Jarvis/Ares project.

## Included
- Responsive animated orb interface.
- Contextual popup modules: Talk, Listen, Vision, Memory, Settings and Workflow Studio.
- Browser speech recognition and speech synthesis where supported.
- Local camera preview with explicit permission.
- Integration endpoint placeholders stored locally (not API secrets).
- Workflow visual starter map.

## Deploy
Static HTML; no build step required. Import into Vercel with framework preset **Other** and no build command.

## Integration status
- **ElevenLabs:** Agent ID field included. Live conversations require a server-side signed URL/token endpoint.
- **Speech input:** Browser Web Speech API where supported.
- **Vision:** Local camera preview only; no AI frame analysis yet.
- **Obsidian:** Connection fields only; requires an authenticated vault bridge.
- **n8n:** Endpoint link and starter flow visualization; live workflow operations require backend API routes and credentials.
- **AI gateway / MCP:** Endpoint placeholders only; backend proxy and secret management remain to be implemented.

## Security
Never place production API keys in frontend code or localStorage. Store secrets in Vercel Environment Variables and access them only from server-side routes. Camera/microphone permissions are requested only after user interaction.

## Local use
Open `index.html` or serve this repository with any static web server.
