import jwt from 'jsonwebtoken'

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d',
  })
}

export function verifyToken(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any
    return { sub: payload.sub }
  } catch {
    return null
  }
}
