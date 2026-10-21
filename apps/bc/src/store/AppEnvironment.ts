import { BCEnvironment } from '@/types/environment'
import { create } from 'zustand'

interface AppEnvironmentState {
  environment?: BCEnvironment
  setEnvironment: (newEnvironment: BCEnvironment) => void
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export const useAppEnvironmentStore = create<AppEnvironmentState>((set) => {
  return {
    environment: undefined,
    setEnvironment: (newEnvironment: BCEnvironment) => {
      set({ environment: newEnvironment })
    },
    isLoading: false,
    setIsLoading: (isLoading: boolean) => {
      set({ isLoading })
    },
  }
})
