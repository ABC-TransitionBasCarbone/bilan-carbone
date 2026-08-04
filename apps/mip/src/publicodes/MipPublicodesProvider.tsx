'use client'
import { Situation } from 'publicodes'
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import { createMipEngine, RawRules } from './mip-engine'

interface MipPublicodesContextValue {
  engine: ReturnType<typeof createMipEngine>
  situation: Situation<string>
  setSituation: (situation: Situation<string>) => void
}

const MipPublicodesContext = createContext<MipPublicodesContextValue | null>(null)

export function MipPublicodesProvider({ children, model }: { children: ReactNode; model: RawRules }) {
  const engine = useMemo(() => createMipEngine(model), [model])
  const [situation, setSituationState] = useState<Situation<string>>({})

  const setSituation = useCallback(
    (newSituation: Situation<string>) => {
      engine.setSituation(newSituation)
      setSituationState(newSituation)
    },
    [engine],
  )

  const contextValue = useMemo(() => ({ engine, situation, setSituation }), [engine, situation, setSituation])

  return <MipPublicodesContext.Provider value={contextValue}>{children}</MipPublicodesContext.Provider>
}

export function useMipPublicodes() {
  const context = useContext(MipPublicodesContext)
  if (!context) {
    throw new Error('useMipPublicodes must be used within MipPublicodesProvider')
  }
  return context
}
