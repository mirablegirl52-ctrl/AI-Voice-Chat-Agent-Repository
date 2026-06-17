# Task: MVP Build — AI Voice Chat Agent

## Files to create
- `/workspace/package.json` (workspace root)
- `/workspace/client/` — full Vite React app
- `/workspace/server/` — full Express + Prisma API
- `/workspace/.env` — env keys (via backend tool)

## Acceptance Criteria
- [ ] Backend builds and serves on :8787
- [ ] Prisma migration creates User, Chat, Message tables
- [ ] Auth: register + login + me work end-to-end
- [ ] Chats CRUD works (create, list, rename, delete)
- [ ] Messages persist and load
- [ ] /api/ai/chat streams LLM response
- [ ] Frontend builds to client/dist
- [ ] All 12 screens render with routing
- [ ] AI orb has 4 animated states
- [ ] Voice waveform visualizes mic input
- [ ] STT captures speech → sends to AI
- [ ] TTS speaks AI response
- [ ] Glassmorphism + neon gradient theme applied
- [ ] LLM key never appears in client bundle
- [ ] Background service runs production command (node dist)
- [ ] Caddy serves /api and static /
- [ ] Preview URL returns 200
