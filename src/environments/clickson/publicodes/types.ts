import { Questions, RuleName } from '@abc-transitionbascarbone/publicodes-clickson'
import Engine, { Situation } from 'publicodes'

export type ClicksonRuleName = RuleName
export type ClicksonQuestion = Questions
export type ClicksonPublicodesEngine = Engine<RuleName>
export type ClicksonSituation = Situation<RuleName>
