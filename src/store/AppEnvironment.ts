import { create } from 'zustand'

export const BASE = 'base'
export const CUT = 'cut'

export type Environment = typeof CUT | typeof BASE

interface AppEnvironmentState {
  environment: Environment
  setEnvironment: (newEnvironment: Environment) => void
}

export const useAppEnvironmentStore = create<AppEnvironmentState>(
  (set): AppEnvironmentState => ({
    environment: CUT, // CHANGE THIS TO BASE TO TEST THE DYNAMIC COMPONENT
    setEnvironment: (environment: Environment) => set({ environment }),
  }),
)
