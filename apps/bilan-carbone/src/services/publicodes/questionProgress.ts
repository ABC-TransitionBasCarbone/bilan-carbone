import {
  EvaluatedGroupLayout,
  EvaluatedListLayout,
  EvaluatedTableLayout,
  getEvaluatedFormLayout,
} from '@/components/publicodes-form/layouts/evaluatedFormLayout'
import { FormLayout } from '@/components/publicodes-form/layouts/formLayout'
import { ListLayoutSituations } from '@/lib/publicodes/context'
import { typedEntries } from '@/utils/object'
import { SubPost } from '@abc-transitionbascarbone/db-common/enums'
import Engine, { Situation } from 'publicodes'
import { SimplifiedPost } from '../posts'
import { getSimplifiedPublicodesConfig, SimplifiedEnvironment } from './simplifiedPublicodesConfig'

export type QuestionStats = { answered: number; total: number }
export type StatsResult = Partial<Record<SimplifiedPost, Partial<Record<SubPost, QuestionStats>>>>

export function computeProgress(
  environment: SimplifiedEnvironment,
  situation: Situation<string>,
  listLayoutSituations: ListLayoutSituations<string>,
): { answeredCount: number; totalCount: number } {
  const config = getSimplifiedPublicodesConfig(environment)
  const engine = config.getEngine().shallowCopy()
  engine.setSituation(situation)
  const progress = getQuestionProgressBySubPost(engine, listLayoutSituations, config.subPostsByPost, config.getFormLayout)
  let answeredCount = 0
  let totalCount = 0
  for (const subPostStats of Object.values(progress)) {
    for (const stats of Object.values(subPostStats ?? {})) {
      answeredCount += stats?.answered ?? 0
      totalCount += stats?.total ?? 0
    }
  }
  return { answeredCount, totalCount }
}

export const getQuestionProgressBySubPost = <RuleName extends string = string>(
  engine: Engine<RuleName>,
  listLayoutSituations: ListLayoutSituations<RuleName>,
  subPostsByPost: Record<SimplifiedPost, SubPost[]>,
  getSubPostLayouts: (subPost: SubPost) => FormLayout<RuleName>[] | undefined,
): StatsResult => {
  return typedEntries(subPostsByPost).reduce<StatsResult>((postAcc, [post, subPosts]) => {
    postAcc[post] = subPosts.reduce<Partial<Record<SubPost, QuestionStats>>>((subPostAcc, subPost) => {
      const layouts = getSubPostLayouts(SubPost[subPost])

      if (!layouts || layouts.length === 0) {
        subPostAcc[subPost] = { answered: 0, total: 0 }
        return subPostAcc
      }

      const evaluatedFormLayouts = layouts.map((layout) => getEvaluatedFormLayout(engine, layout, listLayoutSituations))
      const stats = evaluatedFormLayouts.reduce(
        (acc, evaluatedLayout) => {
          switch (evaluatedLayout.type) {
            case 'input':
              if (evaluatedLayout.evaluatedElement.applicable) {
                acc.total += 1
                if (evaluatedLayout.evaluatedElement.answered) {
                  acc.answered += 1
                }
              }
              break
            case 'list':
              if (isListLayoutApplicable(evaluatedLayout)) {
                acc.total += 1
                if (isListLayoutAnswered(evaluatedLayout)) {
                  acc.answered += 1
                }
              }
              break
            case 'group':
              if (isGroupLayoutApplicable(evaluatedLayout)) {
                acc.total += 1
                if (isGroupLayoutAnswered(evaluatedLayout)) {
                  acc.answered += 1
                }
              }
              break
            case 'table':
              if (isTableLayoutApplicable(evaluatedLayout)) {
                acc.total += 1
                if (isTableLayoutAnswered(evaluatedLayout)) {
                  acc.answered += 1
                }
              }
              break
          }
          return acc
        },
        { answered: 0, total: 0 },
      )

      subPostAcc[subPost] = stats
      return subPostAcc
    }, {})
    return postAcc
  }, {})
}

function isGroupLayoutApplicable(layout: EvaluatedGroupLayout<string>): boolean {
  return layout.evaluatedElements.some((el) => el.applicable)
}

function isGroupLayoutAnswered(layout: EvaluatedGroupLayout<string>): boolean {
  return layout.evaluatedElements.some((el) => el.applicable && el.answered)
}

function isListLayoutApplicable(layout: EvaluatedListLayout<string>): boolean {
  return (
    layout.evaluatedListRows.length === 0 ||
    layout.evaluatedListRows.some((el) => el.elements.every((e) => e.applicable))
  )
}

function isListLayoutAnswered(layout: EvaluatedListLayout<string>): boolean {
  return layout.evaluatedListRows.some((el) => el.elements.every((e) => !e.applicable || e.answered))
}

function isTableLayoutApplicable(layout: EvaluatedTableLayout<string>): boolean {
  return layout.evaluatedRows.flat().some((el) => el.applicable)
}

function isTableLayoutAnswered(layout: EvaluatedTableLayout<string>): boolean {
  return layout.evaluatedRows.some((row) =>
    row.every(
      (el, i) =>
        // NOTE: the first column is the label, so we consider it answered
        i === 0 || !el.applicable || el.answered,
    ),
  )
}
