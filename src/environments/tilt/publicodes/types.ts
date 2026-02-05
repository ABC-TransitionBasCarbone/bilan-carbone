import { Questions, RuleName } from '@abc-transitionbascarbone/publicodes-count'
import Engine, { Situation } from 'publicodes'

export type TiltRuleName = RuleName
export type TiltQuestion = Questions
export type TiltPublicodesEngine = Engine<RuleName>
export type TiltSituation = Situation<RuleName>
