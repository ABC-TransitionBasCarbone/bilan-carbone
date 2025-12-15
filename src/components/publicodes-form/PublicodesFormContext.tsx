'use client'

import { PublicodesFormReturn } from '@/hooks/usePublicodesForm'
import { Environment } from '@prisma/client'
import { Situation } from 'publicodes'
import { createContext, ReactNode, useContext } from 'react'

export type PublicodesFormContextValue<S extends Situation<string> = Situation<string>> = PublicodesFormReturn<S>

export interface PublicodesFormProviderProps<S extends Situation<string>> {
  children: ReactNode
  value: PublicodesFormReturn<S>
}

export function createPublicodesFormContext<S extends Situation<string>>(env: Environment) {
  const PublicodesFormContext = createContext<PublicodesFormContextValue<S> | null>(null)

  const PublicodesFormProvider = ({ children, value }: { children: ReactNode; value: PublicodesFormReturn<S> }) => {
    return (
      <PublicodesFormContext.Provider value={value as PublicodesFormContextValue<S>}>
        {children}
      </PublicodesFormContext.Provider>
    )
  }

  const usePublicodesFormContext = (): PublicodesFormContextValue<S> => {
    const context = useContext(PublicodesFormContext)
    if (!context) {
      throw new Error(`use${env}Publicodes must be used within ${env}PublicodesProvider`)
    }
    return context
  }

  return {
    PublicodesFormProvider,
    usePublicodesFormContext,
  }
}
