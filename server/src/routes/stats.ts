import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, type AuthedRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/error'

const router = Router()

router.use(authMiddleware)

/**
 * GET /api/stats — usage statistics for the logged-in user
 */
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const [chatCount, messageCount] = await Promise.all([
      prisma.chat.count({ where: { userId: req.userId! } }),
      prisma.message.count({ where: { chat: { userId: req.userId! } } }),
    ])
    res.json({ chats: chatCount, messages: messageCount })
  })
)

export default router
