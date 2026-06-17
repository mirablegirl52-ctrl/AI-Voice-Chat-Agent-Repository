# Patterns

## Naming
- Components: PascalCase (`GlassCard.tsx`)
- Hooks: `useVoice`, `useChatStream`
- Stores: `<feature>Store` (zustand)
- API routes: kebab-case paths, camelCase JSON keys

## State
- Zustand stores per feature; no global god-store
- Derived state via selectors

## Error Handling
- Backend: every route wrapped in asyncHandler → central error middleware
- Frontend: API client throws on non-2xx; UI shows toast + retries
- LLM failures → graceful "I had trouble responding" message, not a crash

## Security
- Passwords hashed with bcrypt (10 rounds)
- JWT signed with server secret, 7-day expiry
- LLM key in server env only; never proxied to client
- express-validator on all body inputs
- helmet + CORS allow-list

## Testing
- Backend: vitest + supertest (route-level integration)
- Frontend: vitest + @testing-library/react for components, msw for API mock
- E2E handled by tester sub-agent via Playwright

## Design Tokens (Tailwind)
- bg-deep: #050816
- bg-navy: #0a0f25
- accent-ai: #6366f1 (indigo/blue)
- accent-purple: #a855f7
- accent-cyan: #22d3ee
- glass: rgba(255,255,255,0.05) + backdrop-blur
