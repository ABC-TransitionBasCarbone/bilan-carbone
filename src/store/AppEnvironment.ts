import { create } from 'zustand'

export const BASE = 'base'
export const CUT = 'cut'

export type Environment = typeof CUT | typeof BASE

// TODO DELETE THE .ENV LOGIC WHEN WE CAN GET ENVIRONMENT FORM USER
export const defaultEnvironment: Environment = (process.env.NEXT_PUBLIC_DEFAULT_ENVIRONMENT as Environment) || BASE

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
