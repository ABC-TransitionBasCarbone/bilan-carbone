import { Environment } from '@prisma/client'
import { create } from 'zustand'

interface AppEnvironmentState {
  environment?: Environment
  setEnvironment: (newEnvironment: Environment) => void
}

export const useAppEnvironmentStore = create<AppEnvironmentState>((set) => {
  return {
    environment: undefined,
    setEnvironment: (newEnvironment: Environment) => {
      set({ environment: newEnvironment })
    },
  }
})
