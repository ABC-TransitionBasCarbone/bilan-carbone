import { Environment } from '@prisma/client'
import { FormBuilder } from '@publicodes/forms'
import Engine from 'publicodes'

const engineInstances = new Map<Environment, Engine>()
const formBuilderInstances = new Map<Environment, FormBuilder<string>>()

/**
 * Generic function to get or create a singleton instance for a given environment.
 * If an instance does not already exist, it uses the provided factory function to create one.
 */
function getOrCreateInstance<T>(cache: Map<Environment, unknown>, key: Environment, factory: () => T): T {
  if (!cache.has(key)) {
    cache.set(key, factory())
  }

  return cache.get(key) as T
}

/**
 * Returns a singleton instance of a Publicodes {@link Engine} for the given
 * environment. If an instance does not already exist for the specified
 * environment, it uses the provided `createEngine` function to create one.
 */
export function getOrCreateEngine<RuleName extends string>(
  key: Environment,
  createEngine: () => Engine<RuleName>,
): Engine<RuleName> {
  return getOrCreateInstance(engineInstances, key, createEngine)
}

/**
 * Returns a singleton instance of a {@link FormBuilder} for the given
 * environment. If an instance does not already exist for the specified
 * environment, it uses the provided `createFormBuilder` function to create one.
 */
export function getOrCreateFormBuilder<RuleName extends string>(
  key: Environment,
  createFormBuilder: () => FormBuilder<RuleName>,
): FormBuilder<RuleName> {
  return getOrCreateInstance(formBuilderInstances, key, createFormBuilder)
}
