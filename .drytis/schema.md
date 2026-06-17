# Schema

## Database (MySQL via Prisma)

### User
| field | type | notes |
|---|---|---|
| id | String @id | cuid |
| name | String | |
| email | String @unique | |
| passwordHash | String | nullable (null for social-only mock) |
| voicePreference | String | default "default" |
| personality | String | default "friendly" |
| plan | String | default "free" |
| createdAt | DateTime | |

### Chat
| field | type | notes |
|---|---|---|
| id | String @id | cuid |
| userId | String | FK User |
| title | String | |
| personality | String | snapshot at creation |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Message
| field | type | notes |
|---|---|---|
| id | String @id | cuid |
| chatId | String | FK Chat |
| sender | String | "user" \| "assistant" |
| text | String @db.LongText | |
| createdAt | DateTime | |

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me
- GET  /api/chats
- POST /api/chats
- PUT  /api/chats/:id
- DELETE /api/chats/:id
- GET  /api/chats/:id/messages
- POST /api/ai/chat            (streaming, body: {chatId, message})
- GET  /api/voices             (passthrough list of browser TTS voices metadata)
