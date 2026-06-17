import { describe, it, expect } from 'vitest'
import { PERSONALITIES, getSystemPrompt } from '../lib/llm'

describe('Personality system prompts', () => {
  it('returns a prompt for each personality', () => {
    const keys = Object.keys(PERSONALITIES)
    expect(keys).toContain('friendly')
    expect(keys).toContain('professional')
    expect(keys).toContain('creative')
    expect(keys).toContain('coding')
    expect(keys).toContain('teacher')

    for (const key of keys) {
      const p = PERSONALITIES[key]
      expect(p.name).toBeTruthy()
      expect(p.systemPrompt).toBeTruthy()
      expect(p.systemPrompt.length).toBeGreaterThan(50)
    }
  })

  it('falls back to friendly for unknown personality', () => {
    const prompt = getSystemPrompt('unknown')
    expect(prompt).toBe(PERSONALITIES.friendly.systemPrompt)
  })

  it('each prompt mentions "Aria"', () => {
    for (const key of Object.keys(PERSONALITIES)) {
      expect(PERSONALITIES[key].systemPrompt).toContain('Aria')
    }
  })
})
