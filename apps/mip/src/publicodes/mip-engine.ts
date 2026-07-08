import Engine, { parsePublicodes } from 'publicodes'

export type RawRules = Parameters<typeof parsePublicodes>[0]

export function createMipEngine(rules: RawRules): Engine {
  return new Engine(rules, {
    flag: { filterNotApplicablePossibilities: true },
  })
}
