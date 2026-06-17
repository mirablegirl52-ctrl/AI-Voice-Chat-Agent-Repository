# Infrastructure

## Background Services
- `api`: Node.js Express server on port 8787 (`node dist/index.js`)

## Caddy Proxies
1. PHP server: NONE
2. reverse_proxy `/` → port 5173 in dev / static `client/dist` in prod
3. reverse_proxy `/api/*` → port 8787

For production:
- `client/dist` served as static files by Caddy at `/`
- `/api/*` proxied to the Node API background service (port 8787)

## Env Vars (.env at /workspace/.env)
- DATABASE_URL (mysql)
- JWT_SECRET
- OPENAI_API_KEY (the minted LLM key)
- OPENAI_BASE_URL (https://llm.drytis.ai)
- PORT=8787
- NODE_ENV=production

## Ports
- 8787: Express API
- Static: client/dist served by Caddy

## Setup Script Steps
1. npm install (root)
2. npm install (client + server)
3. cd client && npm run build
4. cd server && npx prisma generate && npx prisma migrate deploy
5. cd server && npm run build
6. procmgr start api (via background service)
