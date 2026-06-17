import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { authMiddleware, type AuthedRequest } from '../middleware/auth'
import { asyncHandler, ApiError } from '../middleware/error'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'Invalid input: ' + parsed.error.message)
    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new ApiError(409, 'Email already registered')

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    })

    const token = signToken(user.id)
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    })
  })
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) throw new ApiError(400, 'Invalid input')
    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) throw new ApiError(401, 'Invalid credentials')

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new ApiError(401, 'Invalid credentials')

    const token = signToken(user.id)
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    })
  })
)

router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    if (!user) throw new ApiError(404, 'User not found')
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        voicePreference: user.voicePreference,
        personality: user.personality,
      },
    })
  })
)

export default router
