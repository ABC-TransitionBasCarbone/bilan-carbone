import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import Engine from 'publicodes'

const engineInstances = new Map<Environment, Engine>()

function getOrCreateInstance<T>(cache: Map<Environment, unknown>, key: Environment, factory: () => T): T {
  if (!cache.has(key)) {
    cache.set(key, factory())
  }

  return cache.get(key) as T
}

export function getOrCreateEngine<RuleName extends string>(
  key: Environment,
  createEngine: () => Engine<RuleName>,
): Engine<RuleName> {
  return getOrCreateInstance(engineInstances, key, createEngine)
}
