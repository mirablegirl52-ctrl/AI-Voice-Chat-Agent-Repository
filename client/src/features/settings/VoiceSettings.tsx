import { motion } from 'framer-motion'
import GlassCard from '../../components/GlassCard'
import { useVoiceSettingsStore } from '../../store/voiceSettingsStore'
import { api } from '../../lib/api'
import { useEffect, useState } from 'react'

const voiceOptions = [
  { id: 'default', name: 'Default', desc: 'System default voice' },
  { id: 'female-us-1', name: 'Aria (US)', desc: 'Female · American' },
  { id: 'male-us-1', name: 'Atlas (US)', desc: 'Male · American' },
  { id: 'female-uk-1', name: 'Luna (UK)', desc: 'Female · British' },
  { id: 'male-uk-1', name: 'Oliver (UK)', desc: 'Male · British' },
  { id: 'female-au-1', name: 'Chloe (AU)', desc: 'Female · Australian' },
  { id: 'male-au-1', name: 'Liam (AU)', desc: 'Male · Australian' },
]

export default function VoiceSettings() {
  const {
    settings, setVoice, setRate, setPitch, setVolume,
    alwaysOn, bargeIn, enhancedProsody,
    setAlwaysOn, setBargeIn, setEnhancedProsody,
  } = useVoiceSettingsStore()
  const [voices, setVoices] = useState(voiceOptions)

  useEffect(() => {
    api.getVoices().then(({ voices: v }) => setVoices(v.length ? v : voiceOptions)).catch(() => {})
  }, [])

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-2">Voice Settings</h1>
      <p className="text-white/40 text-sm mb-6">Advanced human-like voice features</p>

      {/* Advanced features section */}
      <div className="mb-6">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Advanced Features</p>
        <GlassCard className="p-4 space-y-1">
          <ToggleRow
            label="Hands-Free Mode"
            desc="Always listening — no need to tap. Uses voice activity detection."
            value={alwaysOn}
            onChange={setAlwaysOn}
          />
          <div className="h-px bg-white/5 my-2" />
          <ToggleRow
            label="Interrupt (Barge-in)"
            desc="Talk over the AI to interrupt and take your turn."
            value={bargeIn}
            onChange={setBargeIn}
          />
          <div className="h-px bg-white/5 my-2" />
          <ToggleRow
            label="Enhanced Prosody"
            desc="Natural intonation — questions sound like questions, excitement sounds excited."
            value={enhancedProsody}
            onChange={setEnhancedProsody}
          />
        </GlassCard>
      </div>

      {/* Voice selection */}
      <div className="mb-6">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Voice</p>
        <div className="grid grid-cols-2 gap-2">
          {voices.map((v: any) => (
            <motion.button
              key={v.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setVoice(v.id)}
              className={`p-3 rounded-2xl text-left transition-all ${
                settings.voiceId === v.id
                  ? 'bg-ai-gradient shadow-glow'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <p className={`text-sm font-medium ${settings.voiceId === v.id ? 'text-white' : 'text-white/80'}`}>
                {v.name}
              </p>
              <p className={`text-xs mt-0.5 ${settings.voiceId === v.id ? 'text-white/70' : 'text-white/40'}`}>
                {v.desc || v.accent}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <GlassCard className="p-5 space-y-5">
        <SliderControl label="Speed" value={settings.rate} min={0.5} max={2} step={0.1} onChange={setRate} />
        <SliderControl label="Pitch" value={settings.pitch} min={0.5} max={2} step={0.1} onChange={setPitch} />
        <SliderControl label="Volume" value={settings.volume} min={0} max={1} step={0.05} onChange={setVolume} />
      </GlassCard>
    </div>
  )
}

function ToggleRow({
  label, desc, value, onChange,
}: {
  label: string
  desc: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 pr-3">
        <p className="text-sm font-medium text-white/90">{label}</p>
        <p className="text-xs text-white/40 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
          value ? 'bg-ai-500' : 'bg-white/10'
        }`}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: value ? '22px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}

function SliderControl({
  label, value, min, max, step, onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-sm text-ai-400 font-medium">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-ai-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ai-400 [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  )
}
