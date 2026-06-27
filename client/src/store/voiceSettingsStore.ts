import { create } from 'zustand'

export type VoiceSettings = {
  voiceId: string
  rate: number
  pitch: number
  volume: number
}

interface VoiceSettingsStore {
  settings: VoiceSettings
  // Advanced features
  alwaysOn: boolean
  bargeIn: boolean
  enhancedProsody: boolean
  // Actions
  setVoice: (voiceId: string) => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  setVolume: (volume: number) => void
  setAlwaysOn: (on: boolean) => void
  setBargeIn: (on: boolean) => void
  setEnhancedProsody: (on: boolean) => void
}

const loadSettings = (): VoiceSettings => {
  const saved = localStorage.getItem('aria_voice_settings')
  if (saved) return JSON.parse(saved)
  return { voiceId: 'default', rate: 1, pitch: 1, volume: 1 }
}

const persist = (settings: VoiceSettings) => {
  localStorage.setItem('aria_voice_settings', JSON.stringify(settings))
}

const loadBool = (key: string, fallback: boolean): boolean => {
  const val = localStorage.getItem(key)
  if (val === null) return fallback
  return val === 'true'
}

export const useVoiceSettingsStore = create<VoiceSettingsStore>((set, get) => ({
  settings: loadSettings(),
  alwaysOn: loadBool('aria_always_on', false),
  bargeIn: loadBool('aria_barge_in', true),
  enhancedProsody: loadBool('aria_enhanced_prosody', true),

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
  setAlwaysOn: (on) => {
    localStorage.setItem('aria_always_on', String(on))
    set({ alwaysOn: on })
  },
  setBargeIn: (on) => {
    localStorage.setItem('aria_barge_in', String(on))
    set({ bargeIn: on })
  },
  setEnhancedProsody: (on) => {
    localStorage.setItem('aria_enhanced_prosody', String(on))
    set({ enhancedProsody: on })
  },
}))
