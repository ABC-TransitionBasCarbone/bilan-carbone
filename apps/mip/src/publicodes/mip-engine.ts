import rules from '@abc-transitionbascarbone/publicodes-mip'
import Engine from 'publicodes'

let instance: Engine | null = null

export function getMipEngine(): Engine {
  if (!instance) {
    instance = new Engine(rules, {
      flag: { filterNotApplicablePossibilities: true },
      strict: { situation: false },
      // DELETE LOGGER PART THIS IS TEMPORARY
      logger: {
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    })
  }
  return instance
}
