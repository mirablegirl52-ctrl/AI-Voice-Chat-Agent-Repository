import { config } from 'dotenv'
config({ path: '/workspace/.env' })
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chats'
import aiRoutes from './routes/ai'
import voiceRoutes from './routes/voices'
import statsRoutes from './routes/stats'

const app = express()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(
  cors({
    origin: true,
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'aria-voice-api' }))

app.use('/api/auth', authRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/voices', voiceRoutes)
app.use('/api/stats', statsRoutes)

// Serve the React frontend (static files from client/dist)
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist')
app.use(express.static(clientDist))
// SPA fallback: all non-API routes go to index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

app.use(errorHandler)

const PORT = parseInt(process.env.PORT || '8787', 10)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Aria API] listening on :${PORT}`)
})
