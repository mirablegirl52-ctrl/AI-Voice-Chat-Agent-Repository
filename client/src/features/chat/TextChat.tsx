import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { SendIcon, ChevronLeftIcon, CopyIcon, RefreshIcon, CheckIcon } from '../../components/icons'
import { api } from '../../lib/api'

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
}

export default function TextChat() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chatId) return
    api.getMessages(chatId).then(({ messages }) => {
      setMessages(messages)
    }).catch(() => {})
  }, [chatId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText])

  const sendMessage = async () => {
    if (!input.trim() || !chatId || loading) return
    const userMsg = { id: Date.now().toString(), sender: 'user' as const, text: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setStreamingText('')

    try {
      await api.streamChat(chatId, userMsg.text, {
        onDelta: (chunk) => setStreamingText((prev) => prev + chunk),
        onDone: (final) => {
          setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: final }])
          setStreamingText('')
        },
      })
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'assistant', text: 'Sorry, I had trouble responding. Please try again.' },
      ])
      setStreamingText('')
    } finally {
      setLoading(false)
    }
  }

  const regenerate = async () => {
    const lastUser = [...messages].reverse().find((m) => m.sender === 'user')
    if (!lastUser || !chatId || loading) return
    setMessages((prev) => {
      const copy = [...prev]
      if (copy[copy.length - 1]?.sender === 'assistant') copy.pop()
      return copy
    })
    setLoading(true)
    setStreamingText('')
    try {
      await api.streamChat(chatId, lastUser.text, {
        onDelta: (chunk) => setStreamingText((prev) => prev + chunk),
        onDone: (final) => {
          setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'assistant', text: final }])
          setStreamingText('')
        },
      })
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'assistant', text: 'Sorry, I had trouble responding.' },
      ])
      setStreamingText('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigate('/app/history')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10"
        >
          <ChevronLeftIcon className="w-4 h-4 text-white/60" />
        </button>
        <h2 className="text-white/80 font-medium text-sm">Text Chat</h2>
        <div className="w-9" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onRegenerate={regenerate} isLast={m.id === messages[messages.length - 1]?.id} />
        ))}
        {streamingText && (
          <div className="flex justify-start">
            <div className="glass p-3 rounded-2xl rounded-tl-md max-w-[80%]">
              <MarkdownContent text={streamingText} streaming />
            </div>
          </div>
        )}
        {messages.length === 0 && !streamingText && (
          <div className="text-center text-white/30 py-20">
            <p>Start a conversation…</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 pb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading}
          placeholder="Type a message…"
          className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-ai-500 focus:ring-1 focus:ring-ai-500 transition disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="w-12 h-12 flex items-center justify-center rounded-2xl btn-glow disabled:opacity-30"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ message, onRegenerate, isLast }: { message: Message; onRegenerate: () => void; isLast: boolean }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(message.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (message.sender === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-ai-gradient text-white p-3 rounded-2xl rounded-tr-md max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start group">
      <div className="glass p-3 rounded-2xl rounded-tl-md max-w-[85%]">
        <MarkdownContent text={message.text} />
        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition">
          <button onClick={copy} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
            {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {isLast && (
            <button onClick={onRegenerate} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70">
              <RefreshIcon className="w-3.5 h-3.5" />
              Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Safe markdown renderer using react-markdown (no dangerouslySetInnerHTML) */
function MarkdownContent({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <div className="text-sm text-white/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !String(children).includes('\n')
            if (isInline) {
              return (
                <code className="px-1 py-0.5 rounded bg-white/10 text-cyan-neon text-xs" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <SyntaxHighlighter
                style={oneDark as any}
                language={match?.[1] || 'text'}
                PreTag="div"
                customStyle={{
                  background: 'rgba(5,8,22,0.6)',
                  borderRadius: '0.75rem',
                  fontSize: '0.75rem',
                  margin: '0.5rem 0',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            )
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
          },
          ul({ children }) {
            return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-neon underline">
                {children}
              </a>
            )
          },
        }}
      >
        {text}
      </ReactMarkdown>
      {streaming && (
        <span className="inline-block w-1.5 h-4 bg-ai-400 animate-pulse ml-0.5 align-middle rounded-sm" />
      )}
    </div>
  )
}
