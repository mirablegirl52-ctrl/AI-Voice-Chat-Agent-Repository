import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCard from '../../components/GlassCard'
import { SearchIcon, TrashIcon, EditIcon, ChevronRightIcon, PlusIcon, ChatBubbleIcon } from '../../components/icons'
import { api } from '../../lib/api'

interface ChatItem {
  id: string
  title: string
  personality: string
  updatedAt: string
  messageCount: number
}

export default function History() {
  const navigate = useNavigate()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    refresh()
  }, [])

  const refresh = async () => {
    setLoading(true)
    try {
      const { chats } = await api.listChats()
      setChats(chats)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (val: string) => {
    setSearch(val)
    const { chats } = await api.listChats(val)
    setChats(chats)
  }

  const handleDelete = async (id: string) => {
    await api.deleteChat(id)
    setChats((prev) => prev.filter((c) => c.id !== id))
  }

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return
    await api.renameChat(id, editTitle.trim())
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c)))
    setEditingId(null)
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-4">History</h1>

      {/* Search */}
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search conversations…"
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-ai-500 transition"
        />
      </div>

      {/* New chat */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/app/voice')}
        className="w-full glass flex items-center gap-3 p-4 mb-3 hover:bg-white/[0.08] transition"
      >
        <div className="w-10 h-10 rounded-xl bg-ai-gradient flex items-center justify-center shadow-glow">
          <PlusIcon className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-medium">New Conversation</span>
      </motion.button>

      {/* Chat list */}
      {loading ? (
        <div className="text-center text-white/30 py-8">Loading…</div>
      ) : chats.length === 0 ? (
        <div className="text-center py-16">
          <ChatBubbleIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <GlassCard className="p-4 group">
                  {editingId === chat.id ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(chat.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-ai-500 text-white focus:outline-none"
                      />
                      <button
                        onClick={() => handleRename(chat.id)}
                        className="px-3 py-2 rounded-xl bg-ai-500 text-white text-sm"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 cursor-pointer" onClick={() => navigate(`/app/text/${chat.id}`)}>
                        <p className="text-white font-medium text-sm">{chat.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-white/40">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-white/20">·</span>
                          <span className="text-xs text-white/40">{chat.messageCount} msgs</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 capitalize">
                            {chat.personality}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setEditingId(chat.id)
                            setEditTitle(chat.title)
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
                        >
                          <EditIcon className="w-4 h-4 text-white/50" />
                        </button>
                        <button
                          onClick={() => handleDelete(chat.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10"
                        >
                          <TrashIcon className="w-4 h-4 text-white/50 hover:text-red-400" />
                        </button>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-white/20" />
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
