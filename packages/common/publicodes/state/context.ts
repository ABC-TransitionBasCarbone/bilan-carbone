import Engine, { EvaluatedNode, Situation } from 'publicodes'
import { createContext } from 'react'

export type PublicodesContextValue = {
  engine: Engine
  parsedRules: ReturnType<Engine['getParsedRules']>
  safeEvaluate: (ruleName: string) => EvaluatedNode | null
  safeGetRule: (ruleName: string) => ReturnType<Engine['getParsedRules']>[string] | undefined
  setSituation: (situation: Situation<string>) => Situation<string>
  addToEngineSituation: (situation: Situation<string>) => Situation<string>
}

export const PublicodesContext = createContext<PublicodesContextValue | null>(null)
