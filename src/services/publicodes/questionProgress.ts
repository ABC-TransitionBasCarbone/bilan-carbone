import {
  EvaluatedGroupLayout,
  EvaluatedTableLayout,
  getEvaluatedFormLayout,
} from '@/components/publicodes-form/layouts/evaluatedFormLayout'
import { FormLayout } from '@/components/publicodes-form/layouts/formLayout'
import { typedEntries } from '@/utils/object'
import { SubPost } from '@prisma/client'
import Engine from 'publicodes'
import { Post, SimplifiedPost } from '../posts'

export type QuestionStats = { answered: number; total: number }
export type StatsResult = Partial<Record<Post, Partial<Record<SubPost, QuestionStats>>>>

export const getQuestionProgressBySubPost = (
  engine: Engine,
  subPostsByPost: Record<SimplifiedPost, SubPost[]>,
  getSubPostLayouts: (subPost: SubPost) => FormLayout<string>[] | undefined,
): StatsResult => {
  return typedEntries(subPostsByPost).reduce<StatsResult>((postAcc, [post, subPosts]) => {
    postAcc[post] = subPosts.reduce<Partial<Record<SubPost, QuestionStats>>>((subPostAcc, subPost) => {
      const layouts = getSubPostLayouts(SubPost[subPost])

      if (!layouts || layouts.length === 0) {
        subPostAcc[subPost] = { answered: 0, total: 0 }
        return subPostAcc
      }

      const evaluatedFormLayouts = layouts.map((layout) => getEvaluatedFormLayout(engine, layout))
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
  return layout.evaluatedElements.some((el) => !el.applicable || el.answered)
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
