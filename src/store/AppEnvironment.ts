import { create } from 'zustand'

export const BASE = 'base'
export const CUT = 'cut'

export type Environment = typeof CUT | typeof BASE

export const defaultEnvironment: Environment = BASE // CHANGE THIS TO CUT TO TEST THE DYNAMIC COMPONENT

interface AppEnvironmentState {
  environment: Environment
  setEnvironment: (newEnvironment: Environment) => void
}

export const useAppEnvironmentStore = create<AppEnvironmentState>((set) => {
  return {
    environment: defaultEnvironment,
    setEnvironment: (newEnvironment: Environment) => {
      set({ environment: newEnvironment })
    },
  }
})
