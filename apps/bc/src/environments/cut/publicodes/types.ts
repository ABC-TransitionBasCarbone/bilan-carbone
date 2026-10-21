import { Questions, RuleName } from '@abc-transitionbascarbone/publicodes-packages/count'
import Engine, { Situation } from 'publicodes'

export type CutRuleName = RuleName
export type CutQuestion = Questions
export type CutPublicodesEngine = Engine<RuleName>
export type CutSituation = Situation<RuleName>
