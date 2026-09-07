import { ListLayoutSituations } from '@/lib/publicodes/context'
import { typedEntries } from '@/utils/object'
import { SubPost } from '@abc-transitionbascarbone/db-common/enums'
import {
  EvaluatedGroupLayout,
  EvaluatedListLayout,
  EvaluatedMosaicLayout,
  EvaluatedTableLayout,
  FormLayout,
  getEvaluatedFormLayout,
} from '@abc-transitionbascarbone/publicodes/form/layouts'
import { EvaluatedFormElement } from '@publicodes/forms'
import Engine from 'publicodes'
import { SimplifiedPost } from '../posts'

export type QuestionStats = { answered: number; total: number }
export type StatsResult = Partial<Record<SimplifiedPost, Partial<Record<SubPost, QuestionStats>>>>

const hasDefaultValue = (el: EvaluatedFormElement<string>): boolean => {
  return 'defaultValue' in el && el.defaultValue !== null && el.defaultValue !== undefined && el.defaultValue !== 0
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

const isGroupLayoutApplicable = (layout: EvaluatedGroupLayout<string>): boolean => {
  return layout.evaluatedElements.some((el) => el.applicable)
}

const isGroupLayoutAnswered = (layout: EvaluatedGroupLayout<string>): boolean => {
  return layout.evaluatedElements.some((el) => el.applicable && el.answered)
}

const isListLayoutApplicable = (layout: EvaluatedListLayout<string>): boolean => {
  return (
    layout.evaluatedListRows.length === 0 ||
    layout.evaluatedListRows.some((el) => el.elements.every((e) => e.applicable))
  )
}

const isListLayoutAnswered = (layout: EvaluatedListLayout<string>): boolean => {
  return layout.evaluatedListRows.some((el) =>
    el.elements.every((e) => !e.applicable || e.answered || hasDefaultValue(e)),
  )
}

const isTableLayoutApplicable = (layout: EvaluatedTableLayout<string>): boolean => {
  return layout.evaluatedRows.flat().some((el) => el.applicable)
}

const isTableLayoutAnswered = (layout: EvaluatedTableLayout<string>): boolean => {
  return layout.evaluatedRows.some((row) =>
    row.every(
      (el, i) =>
        // NOTE: the first column is the label, so we consider it answered
        i === 0 || !el.applicable || el.answered || hasDefaultValue(el),
    ),
  )
}

const isMosaicLayoutApplicable = (layout: EvaluatedMosaicLayout<string>): boolean => {
  return layout.evaluatedParent.applicable
}

const isMosaicLayoutAnswered = (layout: EvaluatedMosaicLayout<string>): boolean => {
  return layout.evaluatedChildren.some((el) => el.applicable && (el.answered || hasDefaultValue(el)))
}
