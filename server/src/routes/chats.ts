import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware, type AuthedRequest } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/error'

const router = Router()

const createSchema = z.object({
  title: z.string().min(1).max(200),
  personality: z.string().optional(),
})

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  personality: z.string().optional(),
})

router.use(authMiddleware)

router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const search = (req.query.search as string) || ''
    const chats = await prisma.chat.findMany({
      where: {
        userId: req.userId!,
        ...(search ? { title: { contains: search } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    })
    res.json({
      chats: chats.map((c) => ({
        id: c.id,
        title: c.title,
        personality: c.personality,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c._count.messages,
      })),
    })
  })
)

router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'Invalid input')
    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    const chat = await prisma.chat.create({
      data: {
        userId: req.userId!,
        title: parsed.data.title,
        personality: parsed.data.personality || user?.personality || 'friendly',
      },
    })
    res.status(201).json({ chat })
  })
)

router.put(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'Invalid input')

    const chat = await prisma.chat.findFirst({ where: { id: req.params.id, userId: req.userId! } })
    if (!chat) throw new ApiError(404, 'Chat not found')

    const updated = await prisma.chat.update({
      where: { id: req.params.id },
      data: parsed.data,
    })
    res.json({ chat: updated })
  })
)

router.delete(
  '/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const chat = await prisma.chat.findFirst({ where: { id: req.params.id, userId: req.userId! } })
    if (!chat) throw new ApiError(404, 'Chat not found')

    await prisma.chat.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  })
)

router.get(
  '/:id/messages',
  asyncHandler(async (req: AuthedRequest, res) => {
    const chat = await prisma.chat.findFirst({ where: { id: req.params.id, userId: req.userId! } })
    if (!chat) throw new ApiError(404, 'Chat not found')

    const messages = await prisma.message.findMany({
      where: { chatId: req.params.id },
      orderBy: { createdAt: 'asc' },
    })
    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt,
      })),
    })
  })
)

export default router
