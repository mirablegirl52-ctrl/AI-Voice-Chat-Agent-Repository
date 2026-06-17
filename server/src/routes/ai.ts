import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, type AuthedRequest } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/error'
import { streamChatCompletion, getSystemPrompt } from '../lib/llm'

const router = Router()

router.use(authMiddleware)

/**
 * POST /api/ai/chat
 * Body: { chatId: string, message: string }
 * Streams an SSE response with { type: 'delta', content } chunks
 * then { type: 'done', content }.
 *
 * Persists both the user message and the full assistant reply.
 */
router.post(
  '/chat',
  asyncHandler(async (req: AuthedRequest, res) => {
    const { chatId, message } = req.body as { chatId?: string; message?: string }
    if (!chatId || !message || typeof message !== 'string') {
      throw new ApiError(400, 'chatId and message are required')
    }

    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId: req.userId! } })
    if (!chat) throw new ApiError(404, 'Chat not found')

    // Save the user message
    await prisma.message.create({
      data: { chatId, sender: 'user', text: message },
    })

    // Load recent history for context (last 20 messages)
    const historyRows = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: 21, // includes the just-saved user message
    })
    const history = historyRows
      .reverse()
      .slice(0, -1) // drop the current user message (we pass it separately)
      .map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.text,
      }))

    const systemPrompt = getSystemPrompt(chat.personality)

    try {
      const fullText = await streamChatCompletion(res, {
        systemPrompt,
        history,
        userMessage: message,
      })

      // Persist assistant response
      await prisma.message.create({
        data: { chatId, sender: 'assistant', text: fullText },
      })

      // Bump chat updatedAt
      await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } })
    } catch (err: any) {
      // If streaming hasn't started yet, send a clean error JSON
      if (!res.headersSent) {
        throw new ApiError(502, 'AI service error: ' + (err?.message || 'unknown'))
      }
      // If streaming already started, just end the stream
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`)
      res.end()
    }
  })
)

export default router
