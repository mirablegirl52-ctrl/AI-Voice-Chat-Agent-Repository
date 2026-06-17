import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'
import { prisma } from '../lib/prisma'

export interface AuthedRequest extends Request {
  userId?: string
}

export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }
  const token = header.slice(7)
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  const user = await prisma.user.findUnique({ where: { id: decoded.sub } })
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }
  req.userId = user.id
  next()
}
