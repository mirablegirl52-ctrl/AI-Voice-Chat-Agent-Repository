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
  const { settings, setVoice, setRate, setPitch, setVolume } = useVoiceSettingsStore()
  const [voices, setVoices] = useState(voiceOptions)

  useEffect(() => {
    api.getVoices().then(({ voices: v }) => setVoices(v.length ? v : voiceOptions)).catch(() => {})
  }, [])

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-6">Voice Settings</h1>

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

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
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
