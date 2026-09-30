'use client'

import { PublicodesProvider, usePublicodes } from '@abc-transitionbascarbone/application/lib/publicodes/state'
import { createContext, ReactNode, useContext, useMemo } from 'react'
import { createMipEngine, RawRules } from './mip-engine'
import { getRulesMeta } from './mip-rules'

type MipSimulationContextValue = {
  model: RawRules
  meta: ReturnType<typeof getRulesMeta>
}

const MipSimulationContext = createContext<MipSimulationContextValue | null>(null)

export function SimulationProvider({ children, model }: { children: ReactNode; model: RawRules }) {
  const engine = useMemo(() => createMipEngine(model), [model])
  const meta = useMemo(() => getRulesMeta(engine), [engine])
  const value = useMemo(
    () => ({
      model,
      meta,
    }),
    [model, meta],
  )

  return (
    <PublicodesProvider engine={engine}>
      <MipSimulationContext.Provider value={value}>{children}</MipSimulationContext.Provider>
    </PublicodesProvider>
  )
}

export const useSimulation = () => {
  const context = useContext(MipSimulationContext)
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider')
  }
  return { ...usePublicodes(), ...context }
}
