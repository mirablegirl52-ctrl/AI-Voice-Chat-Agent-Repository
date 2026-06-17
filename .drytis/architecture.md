# Architecture

## Directory Structure
```
/workspace
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # reusable UI (Orb, Waveform, GlassCard, Button)
│   │   ├── features/            # screen groups
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── voice/
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── store/               # zustand stores
│   │   ├── lib/                 # api client, voice engine, utils
│   │   ├── theme/               # tailwind config + design tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
├── server/                      # Express + Prisma backend
│   ├── src/
│   │   ├── routes/              # auth, chats, messages, ai, voices
│   │   ├── middleware/          # auth, error
│   │   ├── lib/                 # prisma, llm client, jwt
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma
├── package.json                 # workspace root (scripts)
└── .env                         # shared env (DB, JWT, LLM key)
```

## Data Flow
1. User speaks → SpeechRecognition → transcript
2. Transcript POST /api/ai/chat {chatId, message}
3. Backend loads chat history, builds system prompt from personality
4. Backend streams LLM completion chunk-by-chunk to client
5. Client renders chunks live; on completion, speaks via SpeechSynthesis
6. Both user message + final assistant message persisted by backend

## Routing (frontend)
- /splash, /onboarding, /login, /register
- /app/home, /app/voice, /app/text/:chatId
- /app/history, /app/voice-settings, /app/personality
- /app/profile, /app/subscription, /app/settings
