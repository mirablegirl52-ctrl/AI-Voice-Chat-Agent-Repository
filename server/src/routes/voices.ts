import { Router } from 'express'

const router = Router()

/**
 * GET /api/voices
 * Returns metadata about voice options. The actual voice list comes from
 * the browser's SpeechSynthesis API — this endpoint provides a curated
 * catalog that the frontend maps to available browser voices.
 */
router.get('/', (_req, res) => {
  res.json({
    voices: [
      { id: 'default', name: 'Default', gender: 'neutral', accent: 'auto', lang: 'en-US' },
      { id: 'female-us-1', name: 'Aria (US)', gender: 'female', accent: 'american', lang: 'en-US' },
      { id: 'male-us-1', name: 'Atlas (US)', gender: 'male', accent: 'american', lang: 'en-US' },
      { id: 'female-uk-1', name: 'Luna (UK)', gender: 'female', accent: 'british', lang: 'en-GB' },
      { id: 'male-uk-1', name: 'Oliver (UK)', gender: 'male', accent: 'british', lang: 'en-GB' },
      { id: 'female-au-1', name: 'Chloe (AU)', gender: 'female', accent: 'australian', lang: 'en-AU' },
      { id: 'male-au-1', name: 'Liam (AU)', gender: 'male', accent: 'australian', lang: 'en-AU' },
    ],
  })
})

export default router
