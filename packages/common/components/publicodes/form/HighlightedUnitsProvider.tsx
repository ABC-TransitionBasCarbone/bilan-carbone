'use client'

import { createContext, ReactNode, useContext } from 'react'

// Units highlighted in red in publicodes forms to warn users about an unusual expected unit.
// Defaults to an empty list so environments without specific needs are unaffected.
const HighlightedUnitsContext = createContext<readonly string[]>([])

interface HighlightedUnitsProviderProps {
  units: readonly string[]
  children: ReactNode
}

export const HighlightedUnitsProvider = ({ units, children }: HighlightedUnitsProviderProps) => (
  <HighlightedUnitsContext.Provider value={units}>{children}</HighlightedUnitsContext.Provider>
)

export const useHighlightedUnits = (): readonly string[] => useContext(HighlightedUnitsContext)
