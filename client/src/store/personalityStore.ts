import { create } from 'zustand'

export type Personality = 'friendly' | 'professional' | 'creative' | 'coding' | 'teacher'

interface PersonalityStore {
  personality: Personality
  setPersonality: (p: Personality) => void
}

export const usePersonalityStore = create<PersonalityStore>((set) => ({
  personality: (localStorage.getItem('aria_personality') as Personality) || 'friendly',
  setPersonality: (p) => {
    localStorage.setItem('aria_personality', p)
    set({ personality: p })
  },
}))
