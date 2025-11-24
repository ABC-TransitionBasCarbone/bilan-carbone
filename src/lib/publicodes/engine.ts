import { Environment } from '@prisma/client'
import Engine, { Situation } from 'publicodes'

const engineInstances = new Map<Environment, Engine>()

/**
 * Returns a singleton instance of a Publicodes {@link Engine} for the given
 * environment. If an instance does not already exist for the specified
 * environment, it uses the provided `createEngine` function to create one.
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

export function evaluateWithSituation<RuleName extends string, S extends Situation<RuleName>>(
  engine: Engine<RuleName>,
  ruleName: RuleName,
  situation: S,
) {
  const tempEngine = engine.shallowCopy()
  tempEngine.setSituation(situation)
  return tempEngine.evaluate(ruleName)
}
