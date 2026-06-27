import OpenAI from 'openai'
import type { Response } from 'express'

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      baseURL: process.env.OPENAI_BASE_URL || 'https://llm.drytis.ai',
    })
  }
  return _client
}

export const PERSONALITIES: Record<string, { name: string; systemPrompt: string; prosodyProfile: string }> = {
  friendly: {
    name: 'Friendly',
    prosodyProfile: 'warm',
    systemPrompt:
      'You are Aria, a warm, friendly, and encouraging AI voice assistant. You speak in a conversational, natural tone — like a supportive friend. Keep responses concise (2-4 sentences) since they will be spoken aloud. Be genuinely helpful and upbeat. Use natural contractions (I\'ll, that\'s, let\'s). Vary your sentence length for a natural rhythm.',
  },
  professional: {
    name: 'Professional',
    prosodyProfile: 'steady',
    systemPrompt:
      'You are Aria, a professional and polished AI assistant. You communicate clearly, precisely, and with expertise. Keep responses concise (2-4 sentences) since they will be spoken aloud. Be direct and informative. Use measured, confident phrasing.',
  },
  creative: {
    name: 'Creative',
    prosodyProfile: 'expressive',
    systemPrompt:
      'You are Aria, a highly creative and imaginative AI assistant. You love brainstorming, telling stories, and exploring ideas. Keep responses concise (2-4 sentences) since they will be spoken aloud. Be expressive, vivid, and inspiring. Use emotive language.',
  },
  coding: {
    name: 'Coding Expert',
    prosodyProfile: 'precise',
    systemPrompt:
      'You are Aria, an expert software engineer AI assistant. You give precise, accurate technical guidance with clean code examples. When showing code, always use markdown code blocks with language tags. Be thorough but concise. Speak in clear, logical steps.',
  },
  teacher: {
    name: 'Teacher',
    prosodyProfile: 'patient',
    systemPrompt:
      'You are Aria, a patient and knowledgeable AI tutor. You break down complex topics into simple, easy-to-understand explanations. You use analogies and step-by-step guidance. Keep responses clear and concise since they will be spoken aloud. Use an encouraging, unhurried tone.',
  },
}

export function getSystemPrompt(personality: string): string {
  return (PERSONALITIES[personality] || PERSONALITIES.friendly).systemPrompt
}

export async function streamChatCompletion(
  res: Response,
  opts: { systemPrompt: string; history: { role: 'user' | 'assistant'; content: string }[]; userMessage: string }
): Promise<string> {
  const messages: any[] = [
    { role: 'system', content: opts.systemPrompt },
    ...opts.history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: opts.userMessage },
  ]

  const stream = await getClient().chat.completions.create({
    model: 'drytis/kimi',
    messages,
    stream: true,
    max_tokens: 1024,
    temperature: 1,
  })

  let fullText = ''
  let sentenceBuffer = ''
  // Sentence-ending punctuation followed by space/newline or end
  const sentenceBoundary = /([.!?])\s+/g

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || ''
    if (delta) {
      fullText += delta
      sentenceBuffer += delta

      // Check for sentence boundaries — emit the sentence chunk for streaming TTS
      // Note: only emit 'sentence' events (for TTS), the raw 'delta' handles display text
      let match
      let lastIndex = 0
      while ((match = sentenceBoundary.exec(sentenceBuffer)) !== null) {
        const sentenceEnd = match.index + match[0].length
        const sentence = sentenceBuffer.slice(lastIndex, sentenceEnd).trim()
        if (sentence) {
          res.write(`data: ${JSON.stringify({ type: 'sentence', content: sentence })}\n\n`)
        }
        lastIndex = sentenceEnd
      }
      // Keep the remainder in the buffer
      if (lastIndex > 0) {
        sentenceBuffer = sentenceBuffer.slice(lastIndex)
      }

      // Always emit the raw delta for text display
      res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`)
    }
  }

  // Flush any remaining text as a final sentence
  const remaining = sentenceBuffer.trim()
  if (remaining) {
    res.write(`data: ${JSON.stringify({ type: 'sentence', content: remaining })}\n\n`)
  }

  res.write(`data: ${JSON.stringify({ type: 'done', content: fullText })}\n\n`)
  res.end()
  return fullText
}
