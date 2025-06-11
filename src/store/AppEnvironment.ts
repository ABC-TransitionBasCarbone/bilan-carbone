import { Environment } from '@prisma/client'
import { create } from 'zustand'

interface AppEnvironmentState {
  environment?: Environment
  setEnvironment: (newEnvironment: Environment) => void
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export const useAppEnvironmentStore = create<AppEnvironmentState>((set) => {
  return {
    environment: undefined,
    setEnvironment: (newEnvironment: Environment) => {
      set({ environment: newEnvironment })
    },
    isLoading: false,
    setIsLoading: (isLoading: boolean) => {
      set({ isLoading })
    },
  }
})
