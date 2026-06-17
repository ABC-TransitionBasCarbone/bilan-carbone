'use client'
import { Situation } from 'publicodes'
import { createContext, ReactNode, useContext, useState } from 'react'
import { createMipEngine } from './mip-engine'
import model from './publicodes-mip.model.json'

interface MipPublicodesContextValue {
  engine: ReturnType<typeof createMipEngine>
  situation: Situation<string>
  setSituation: (situation: Situation<string>) => void
}

const MipPublicodesContext = createContext<MipPublicodesContextValue | null>(null)

export function MipPublicodesProvider({ children }: { children: ReactNode }) {
  const engine = createMipEngine(model)
  const [situation, setSituationState] = useState<Situation<string>>({})

  const setSituation = (newSituation: Situation<string>) => {
    engine.setSituation(newSituation)
    setSituationState(newSituation)
  }

  return (
    <MipPublicodesContext.Provider value={{ engine, situation, setSituation }}>
      {children}
    </MipPublicodesContext.Provider>
  )
}

export function useMipPublicodes() {
  const context = useContext(MipPublicodesContext)
  if (!context) {
    throw new Error('useMipPublicodes must be used within MipPublicodesProvider')
  }
  return context
}
