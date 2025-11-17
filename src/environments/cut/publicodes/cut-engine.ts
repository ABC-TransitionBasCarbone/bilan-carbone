import { getOrCreateEngine } from '@/lib/publicodes/engine'
import rules from '@abc-transitionbascarbone/publicodes-count'
import Engine from 'publicodes'
import { CutPublicodesEngine } from './types'

export function getCutEngine(): CutPublicodesEngine {
  return getOrCreateEngine('CUT', () => new Engine(rules))
}
