// src/lib/publicodes/engine.ts

import { Environment } from '@prisma/client'
import Engine, { Situation } from 'publicodes'

/**
 * Map pour stocker les instances singleton des engines par environnement.
 */
const engineInstances = new Map<Environment, Engine<any>>()

/**
 * Crée ou récupère un singleton d'engine pour un environnement donné.
 */
export function getOrCreateEngine<RuleName extends string>(
  key: Environment,
  createEngine: () => Engine<RuleName>,
): Engine<RuleName> {
  if (!engineInstances.has(key)) {
    engineInstances.set(key, createEngine())
  }

  return engineInstances.get(key) as Engine<RuleName>
}

/**
 * Évalue une règle avec une situation donnée (calcul isolé).
 * Utilise {@link Engine.shallowCopy} pour éviter de modifier l'état de l'engine original.
 */
export function evaluateWithSituation<RuleName extends string, S extends Situation<RuleName>>(
  engine: Engine<RuleName>,
  ruleName: RuleName,
  situation: S,
) {
  const tempEngine = engine.shallowCopy()
  tempEngine.setSituation(situation)
  return tempEngine.evaluate(ruleName)
}
