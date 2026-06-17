# AI Voice Chat Agent — Spec

## Overview
A premium AI voice-powered assistant with a futuristic glassmorphism dark-mode UI. Users can speak to the AI, receive natural spoken responses, manage conversations, and customize the assistant's personality and voice. The app feels like a modern voice AI product.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- State: Zustand
- Voice: Web Speech API (SpeechRecognition + SpeechSynthesis)
- Backend: Node.js + Express + Prisma
- DB: MySQL (auto-provisioned)
- AI: OpenAI-compatible LLM (key server-side only)

## Key Decisions
- Web Speech API for STT/TTS: zero-cost, browser-native, no extra SDK
- Streaming LLM via fetch ReadableStream → SSE-like chunked response
- JWT auth stored in localStorage; HTTP-only cookie not needed for SPA
- LLM API key NEVER shipped to frontend; backend proxies all AI calls
- MySQL + Prisma for typed migrations and clean ORM

## Out of Scope (this build)
- Real social OAuth (Google/Apple) — mock UI only with email auth working
- Push notifications — UI present but no real push delivery
- Offline mode — UI indicator only
