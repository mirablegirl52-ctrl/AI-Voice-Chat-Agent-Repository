# Scope

## Features by Module

### Auth
- Email register / login (bcrypt + JWT)
- Mock Google / Apple login buttons (UI only)
- Session persistence (token in localStorage)

### Voice Chat
- Real-time STT via SpeechRecognition
- Live waveform visualization from mic levels
- AI orb with 4 states: idle, listening, thinking, speaking
- TTS playback of AI responses
- Voice interruption (cancel speaking)
- Auto re-listen after AI finishes (toggleable)

### Text Chat
- Markdown rendering with syntax-highlighted code blocks
- Streaming responses (word-by-word)
- Copy message, regenerate response
- Scroll-to-bottom auto

### Conversations
- Create, list, rename, delete chats
- Per-chat message history
- Search across conversations

### Personalization
- 5 AI personalities (system prompt swap)
- Voice selection (male/female/accents)
- Voice speed / pitch / volume

### Account
- Profile (avatar, name, usage stats)
- Subscription tiers (Free/Pro/Premium) — UI + metadata only
- Settings (theme accent, language, privacy toggles, data export)
