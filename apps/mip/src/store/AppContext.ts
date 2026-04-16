import { create } from 'zustand'

export const STUDY = 'STUDY'
export const ORGANIZATION = 'ORGANIZATION'
export const OTHER = 'OTHER'

export type Context = typeof STUDY | typeof ORGANIZATION | typeof OTHER

interface AppContextState {
  context: Context
  contextId: string
  setContext: (newContext: Context) => void
  setContextId: (newContextId: string) => void
}

export const useAppContextStore = create<AppContextState>(
  (set): AppContextState => ({
    context: OTHER,
    contextId: '',
    setContext: (context: Context) => set({ context }),
    setContextId: (contextId: string) => set({ contextId }),
  }),
)
