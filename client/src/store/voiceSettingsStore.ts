import { create } from 'zustand'

export type VoiceSettings = {
  voiceId: string
  rate: number
  pitch: number
  volume: number
}

interface VoiceSettingsStore {
  settings: VoiceSettings
  setVoice: (voiceId: string) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  setVolume: (volume: number) => void
}

const loadSettings = (): VoiceSettings => {
  const saved = localStorage.getItem('aria_voice_settings')
  if (saved) return JSON.parse(saved)
  return { voiceId: 'default', rate: 1, pitch: 1, volume: 1 }
}

const persist = (settings: VoiceSettings) => {
  localStorage.setItem('aria_voice_settings', JSON.stringify(settings))
}

export const useVoiceSettingsStore = create<VoiceSettingsStore>((set, get) => ({
  settings: loadSettings(),
  setVoice: (voiceId) => {
    const next = { ...get().settings, voiceId }
    persist(next)
    set({ settings: next })
  },
  setRate: (rate) => {
    const next = { ...get().settings, rate }
    persist(next)
    set({ settings: next })
  },
  setPitch: (pitch) => {
    const next = { ...get().settings, pitch }
    persist(next)
    set({ settings: next })
  },
  setVolume: (volume) => {
    const next = { ...get().settings, volume }
    persist(next)
    set({ settings: next })
  },
}))
