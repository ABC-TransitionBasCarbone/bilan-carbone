'use client'

import { UsePublicodesFormReturn } from '@/hooks/usePublicodesForm'
import { Environment } from '@prisma/client'
import { Situation } from 'publicodes'
import { createContext, ReactNode, useContext } from 'react'

export type PublicodesFormContextValue<S extends Situation<string> = Situation<string>> = UsePublicodesFormReturn<S>

export interface PublicodesFormProviderProps<S extends Situation<string>> {
  children: ReactNode
  value: UsePublicodesFormReturn<S>
}

export function createPublicodesFormContext<S extends Situation<string>>(env: Environment) {
  const EnvironmentContext = createContext<PublicodesFormContextValue<S> | null>(null)

  const Provider = ({ children, value }: { children: ReactNode; value: UsePublicodesFormReturn<S> }) => {
    return (
      <EnvironmentContext.Provider value={value as PublicodesFormContextValue<S>}>
        {children}
      </EnvironmentContext.Provider>
    )
  }

  const useContextHook = (): PublicodesFormContextValue<S> => {
    const context = useContext(EnvironmentContext)
    if (!context) {
      throw new Error(`use${env}Publicodes must be used within ${env}PublicodesProvider`)
    }
    return context
  }

  return {
    Provider,
    useContext: useContextHook,
  }
}
