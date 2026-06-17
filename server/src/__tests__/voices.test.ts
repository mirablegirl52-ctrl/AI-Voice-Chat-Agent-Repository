import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import json from 'express'

// Test the voice catalog endpoint in isolation
import voiceRoutes from '../routes/voices'

function createTestApp() {
  const app = express()
  app.use(json())
  app.use('/api/voices', voiceRoutes)
  return app
}

describe('GET /api/voices', () => {
  it('returns a list of voices', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/voices')

    expect(res.status).toBe(200)
    expect(res.body.voices).toBeInstanceOf(Array)
    expect(res.body.voices.length).toBeGreaterThan(3)

    const first = res.body.voices[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('name')
    expect(first).toHaveProperty('gender')
    expect(first).toHaveProperty('lang')
  })

  it('includes both male and female voices', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/voices')
    const genders = res.body.voices.map((v: any) => v.gender)
    expect(genders).toContain('female')
    expect(genders).toContain('male')
  })

  it('includes multiple accents/languages', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/voices')
    const langs = res.body.voices.map((v: any) => v.lang)
    expect(langs).toContain('en-US')
    expect(langs).toContain('en-GB')
  })
})
