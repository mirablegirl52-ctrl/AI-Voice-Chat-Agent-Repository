import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { signToken, verifyToken } from '../lib/jwt'

describe('JWT utilities', () => {
  it('signs and verifies a token', () => {
    process.env.JWT_SECRET = 'test-secret'
    const token = signToken('user-123')
    expect(token).toBeTruthy()

    const decoded = verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded!.sub).toBe('user-123')
  })

  it('rejects an invalid token', () => {
    process.env.JWT_SECRET = 'test-secret'
    const decoded = verifyToken('invalid-token-string')
    expect(decoded).toBeNull()
  })

  it('rejects a token signed with a different secret', () => {
    process.env.JWT_SECRET = 'secret-a'
    const token = signToken('user-1')

    process.env.JWT_SECRET = 'secret-b'
    const decoded = verifyToken(token)
    expect(decoded).toBeNull()
  })
})

describe('bcrypt password hashing', () => {
  it('hashes and verifies a password', async () => {
    const password = 'mySecret123'
    const hash = await bcrypt.hash(password, 10)
    expect(hash).not.toBe(password)
    expect(await bcrypt.compare(password, hash)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    const hash = await bcrypt.hash('correct', 10)
    expect(await bcrypt.compare('wrong', hash)).toBe(false)
  })
})
