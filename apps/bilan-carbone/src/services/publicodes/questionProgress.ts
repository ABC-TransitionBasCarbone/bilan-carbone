import { ListLayoutSituations } from '@/lib/publicodes/context'
import { typedEntries } from '@/utils/object'
import { SubPost } from '@abc-transitionbascarbone/db-common/enums'
import {
  hasDefaultValue,
  isGroupLayoutAnswered,
  isGroupLayoutApplicable,
  isListLayoutAnswered,
  isListLayoutApplicable,
  isMosaicLayoutAnswered,
  isMosaicLayoutApplicable,
  isTableLayoutAnswered,
  isTableLayoutApplicable,
} from '@abc-transitionbascarbone/publicodes/form'
import { FormLayout, getEvaluatedFormLayout } from '@abc-transitionbascarbone/publicodes/form/layouts'
import Engine from 'publicodes'
import { SimplifiedPost } from '../posts'

export type QuestionStats = { answered: number; total: number }
export type StatsResult = Partial<Record<SimplifiedPost, Partial<Record<SubPost, QuestionStats>>>>

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
                if (evaluatedLayout.evaluatedElement.answered || hasDefaultValue(evaluatedLayout.evaluatedElement)) {
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
            case 'mosaic':
              if (isMosaicLayoutApplicable(evaluatedLayout)) {
                acc.total += 1
                if (isMosaicLayoutAnswered(evaluatedLayout)) {
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
