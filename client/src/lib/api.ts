const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('aria_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  register(name: string, email: string, password: string) {
    return request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  },
  login(email: string, password: string) {
    return request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  me() {
    return request<{ user: any }>('/auth/me')
  },
  listChats(search?: string) {
    return request<{ chats: any[] }>(`/chats${search ? `?search=${encodeURIComponent(search)}` : ''}`)
  },
  createChat(title: string, personality?: string) {
    return request<{ chat: any }>('/chats', {
      method: 'POST',
      body: JSON.stringify({ title, personality }),
    })
  },
  renameChat(id: string, title: string) {
    return request<{ chat: any }>(`/chats/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    })
  },
  deleteChat(id: string) {
    return request<{ success: boolean }>(`/chats/${id}`, { method: 'DELETE' })
  },
  getMessages(chatId: string) {
    return request<{ messages: any[] }>(`/chats/${chatId}/messages`)
  },
  getVoices() {
    return request<{ voices: any[] }>('/voices')
  },
  getStats() {
    return request<{ chats: number; messages: number }>('/stats')
  },
  /**
   * Stream a chat completion. Calls onDelta for each text chunk, onDone when finished.
   * Returns the full text.
   */
  async streamChat(
    chatId: string,
    message: string,
    handlers: { onDelta?: (text: string) => void; onDone?: (fullText: string) => void }
  ): Promise<string> {
    const token = getToken()
    const res = await fetch(`${BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ chatId, message }),
    })
    if (!res.ok || !res.body) {
      throw new Error('AI request failed')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''
    let doneFired = false // Guard against duplicate onDone (issue: connection drop)

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.type === 'delta' && payload.content) {
              fullText += payload.content
              handlers.onDelta?.(payload.content)
            } else if (payload.type === 'done') {
              doneFired = true
              handlers.onDone?.(payload.content || fullText)
              return payload.content || fullText
            } else if (payload.type === 'error') {
              throw new Error(payload.message || 'Stream error')
            }
          } catch (e) {
            // Re-throw if it's our explicit error payload
            if (e instanceof Error && e.message === (e as any).message) throw e
            // skip malformed JSON lines
          }
        }
      }
    }
    // Fallback: stream ended without a `done` event — fire once
    if (!doneFired && fullText) {
      handlers.onDone?.(fullText)
    }
    return fullText
  },
}
