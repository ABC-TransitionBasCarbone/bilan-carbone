import { create } from 'zustand'

export const BASE = 'base'
export const CUT = 'cut'

export type Environment = typeof CUT | typeof BASE

interface AppEnvironmentState {
  environment: Environment
  setEnvironment: (newEnvironment: Environment) => void
}

export const useAppEnvironmentStore = create<AppEnvironmentState>((set) => {
  const initialEnv = BASE // CHANGE THIS TO CUT TO TEST THE DYNAMIC COMPONENT

  return {
    environment: initialEnv,
    setEnvironment: (newEnvironment: Environment) => {
      set({ environment: newEnvironment })
    },
  }
})
