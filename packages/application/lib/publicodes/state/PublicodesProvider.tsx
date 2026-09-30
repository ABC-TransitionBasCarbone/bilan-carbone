'use client'

import Engine, { Situation } from 'publicodes'
import { ReactNode, useCallback, useContext, useMemo } from 'react'
import { PublicodesContext } from './context'

export function PublicodesProvider({ children, engine }: { children: ReactNode; engine: Engine }) {
  const parsedRules = useMemo(() => engine.getParsedRules(), [engine])
  const safeEvaluate = useCallback(
    (ruleName: string) => {
      try {
        return engine.evaluate(ruleName)
      } catch {
        return null
      }
    },
    [engine],
  )
  const safeGetRule = useCallback((ruleName: string) => parsedRules[ruleName], [parsedRules])
  const setSituation = useCallback(
    (situation: Situation<string>) => {
      engine.setSituation(situation)
      return engine.getSituation()
    },
    [engine],
  )
  const addToEngineSituation = useCallback(
    (situation: Situation<string>) => setSituation({ ...engine.getSituation(), ...situation }),
    [engine, setSituation],
  )
  return (
    <PublicodesContext.Provider
      value={{ engine, parsedRules, safeEvaluate, safeGetRule, setSituation, addToEngineSituation }}
    >
      {children}
    </PublicodesContext.Provider>
  )
}

export const usePublicodes = () => {
  const context = useContext(PublicodesContext)
  if (!context) {
    throw new Error('usePublicodes must be used within PublicodesProvider')
  }
  return context
}
