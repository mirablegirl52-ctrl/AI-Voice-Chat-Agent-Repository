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

export const PERSONALITIES: Record<string, { name: string; systemPrompt: string }> = {
  friendly: {
    name: 'Friendly',
    systemPrompt:
      'You are Aria, a warm, friendly, and encouraging AI voice assistant. You speak in a conversational, natural tone — like a supportive friend. Keep responses concise (2-4 sentences) since they will be spoken aloud. Be genuinely helpful and upbeat.',
  },
  professional: {
    name: 'Professional',
    systemPrompt:
      'You are Aria, a professional and polished AI assistant. You communicate clearly, precisely, and with expertise. Keep responses concise (2-4 sentences) since they will be spoken aloud. Be direct and informative.',
  },
  creative: {
    name: 'Creative',
    systemPrompt:
      'You are Aria, a highly creative and imaginative AI assistant. You love brainstorming, telling stories, and exploring ideas. Keep responses concise (2-4 sentences) since they will be spoken aloud. Be expressive and inspiring.',
  },
  coding: {
    name: 'Coding Expert',
    systemPrompt:
      'You are Aria, an expert software engineer AI assistant. You give precise, accurate technical guidance with clean code examples. When showing code, always use markdown code blocks with language tags. Be thorough but concise.',
  },
  teacher: {
    name: 'Teacher',
    systemPrompt:
      'You are Aria, a patient and knowledgeable AI tutor. You break down complex topics into simple, easy-to-understand explanations. You use analogies and step-by-step guidance. Keep responses clear and concise since they will be spoken aloud.',
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
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content || ''
    if (delta) {
      fullText += delta
      res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`)
    }
  }

  res.write(`data: ${JSON.stringify({ type: 'done', content: fullText })}\n\n`)
  res.end()
  return fullText
}
