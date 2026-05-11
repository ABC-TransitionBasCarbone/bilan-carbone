import { Situation } from 'publicodes'

export type ListLayoutSituations<RuleName extends string = string> = Partial<
  Record<RuleName, Array<{ id: string; situation: Situation<RuleName> }>>
>
