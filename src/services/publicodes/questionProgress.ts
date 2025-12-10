import {
  EvaluatedGroupLayout,
  EvaluatedTableLayout,
  getEvaluatedFormLayout,
} from '@/components/publicodes-form/layouts/evaluatedFormLayout'
import { FormLayout } from '@/components/publicodes-form/layouts/formLayout'
import { SubPost } from '@prisma/client'
import Engine, { Situation } from 'publicodes'
import { Post } from '../posts'

export type QuestionStats = { answered: number; total: number }
export type StatsResult = Partial<Record<Post, Partial<Record<SubPost, QuestionStats>>>>

export function getQuestionProgressBySubPost<RuleName extends string>(
  engine: Engine<RuleName>,
  situation: Situation<RuleName>,
  getSubPostLayouts: (subPost: SubPost) => FormLayout<RuleName>[] | undefined,
  subPostsByPost: Record<Post, SubPost[]>,
): StatsResult {
  const localEngine = engine.shallowCopy()
  localEngine.setSituation(situation)

  return Object.fromEntries(
    Object.entries(subPostsByPost).map(([post, subPosts]) => {
      return [
        post,
        Object.fromEntries(
          subPosts.map((subPost) => {
            const layouts = getSubPostLayouts(SubPost[subPost])

            if (!layouts || layouts.length === 0) {
              return [subPost, { answered: 0, total: 0 }]
            }

            const evaluatedFormLayouts = layouts.map((layout) => getEvaluatedFormLayout(engine, layout, situation))
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

            return [subPost, stats]
          }),
        ),
      ]
    }),
  )
}

function isGroupLayoutApplicable(layout: EvaluatedGroupLayout<string>): boolean {
  return layout.evaluatedElements.some((el) => el.applicable)
}

function isGroupLayoutAnswered(layout: EvaluatedGroupLayout<string>): boolean {
  return layout.evaluatedElements.some((el) => el.applicable && el.answered)
}

// TODO: we might want to consider a table as answered only if all applicable rows are answered
function isTableLayoutApplicable(layout: EvaluatedTableLayout<string>): boolean {
  return layout.evaluatedRows.flat().some((el) => el.applicable)
}

function isTableLayoutAnswered(layout: EvaluatedTableLayout<string>): boolean {
  return layout.evaluatedRows.flat().some((el) => el.applicable && el.answered)
}
