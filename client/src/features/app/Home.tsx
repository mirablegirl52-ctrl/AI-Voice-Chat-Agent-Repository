import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AIOrb from '../../components/AIOrb'
import GlassCard from '../../components/GlassCard'
import { ChatBubbleIcon, CodeIcon, SearchIcon, SparkleIcon, GlobeIcon, MicIcon } from '../../components/icons'

const quickActions = [
  { icon: <ChatBubbleIcon className="w-5 h-5" />, label: 'Ask Question', color: 'from-ai-500 to-ai-600' },
  { icon: <GlobeIcon className="w-5 h-5" />, label: 'Translate', color: 'from-cyan-neon to-blue-500' },
  { icon: <SparkleIcon className="w-5 h-5" />, label: 'Write', color: 'from-purple-neon to-pink-500' },
  { icon: <CodeIcon className="w-5 h-5" />, label: 'Code', color: 'from-emerald-400 to-teal-500' },
  { icon: <SearchIcon className="w-5 h-5" />, label: 'Search', color: 'from-amber-400 to-orange-500' },
  { icon: <SparkleIcon className="w-5 h-5" />, label: 'Summarize', color: 'from-rose-400 to-red-500' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center py-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <p className="text-white/50 text-sm mb-1">Good to see you</p>
        <h1 className="text-3xl font-bold text-gradient">How can I help you?</h1>
      </motion.div>

      {/* AI Orb */}
      <div className="mb-8">
        <AIOrb
          state="idle"
          size={180}
          onClick={() => navigate('/app/voice')}
        />
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-sm">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={async () => {
                // Create a new chat and navigate
                const title = action.label === 'Ask Question' ? 'New question' : action.label
                navigate('/app/voice')
              }}
              className="glass flex flex-col items-center gap-2 p-4 hover:bg-white/[0.08] transition group"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
              >
                {action.icon}
              </div>
              <span className="text-xs text-white/70">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Start voice chat button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => navigate('/app/voice')}
        className="mt-8 btn-glow px-8 py-4 rounded-full flex items-center gap-3 text-base"
      >
        <MicIcon className="w-5 h-5" />
        Start Talking
      </motion.button>
    </div>
  )
}
