import { motion } from 'framer-motion'
import GlassCard from '../../components/GlassCard'
import { usePersonalityStore, type Personality } from '../../store/personalityStore'
import { CheckIcon } from '../../components/icons'

const personalities: { id: Personality; name: string; emoji: string; desc: string }[] = [
  { id: 'friendly', name: 'Friendly', emoji: '😊', desc: 'Warm, encouraging, like a supportive friend' },
  { id: 'professional', name: 'Professional', emoji: '💼', desc: 'Polished, precise, expert-level guidance' },
  { id: 'creative', name: 'Creative', emoji: '🎨', desc: 'Imaginative, inspiring, loves brainstorming' },
  { id: 'coding', name: 'Coding Expert', emoji: '💻', desc: 'Technical precision with clean code examples' },
  { id: 'teacher', name: 'Teacher', emoji: '📚', desc: 'Patient, step-by-step explanations' },
]

export default function Personality() {
  const { personality, setPersonality } = usePersonalityStore()

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-2">AI Personality</h1>
      <p className="text-white/50 text-sm mb-6">Choose how Aria speaks and thinks</p>

      <div className="space-y-3">
        {personalities.map((p) => {
          const selected = personality === p.id
          return (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPersonality(p.id)}
              className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 ${
                selected
                  ? 'bg-ai-gradient shadow-glow'
                  : 'bg-white/5 border border-white/10 hover:bg-white/[0.08]'
              }`}
            >
              <div className="text-3xl">{p.emoji}</div>
              <div className="flex-1">
                <p className={`font-semibold ${selected ? 'text-white' : 'text-white/80'}`}>{p.name}</p>
                <p className={`text-xs mt-0.5 ${selected ? 'text-white/70' : 'text-white/40'}`}>{p.desc}</p>
              </div>
              {selected && <CheckIcon className="w-5 h-5 text-white" />}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
