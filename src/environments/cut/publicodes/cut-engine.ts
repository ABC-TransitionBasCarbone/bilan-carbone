import { getOrCreateEngine } from '@/lib/publicodes/engine'
import rules from '@abc-transitionbascarbone/publicodes-count'
import Engine from 'publicodes'
import { CutPublicodesEngine } from './types'

export function getCutEngine(): CutPublicodesEngine {
  return getOrCreateEngine('CUT', () => {
    console.time('[cut:publicodes] 🏗  Engine init')
    const engine = new Engine(rules, { flag: { filterNotApplicablePossibilities: true } })
    console.timeEnd('[cut:publicodes] 🏗  Engine init')
    return engine
  })
}
