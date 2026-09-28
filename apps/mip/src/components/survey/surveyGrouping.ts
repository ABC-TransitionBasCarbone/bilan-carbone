import { createMipEngine } from '@/publicodes/mip-engine'
import { getPlancherWarning, getQuestionType, MipQuestionType } from '@/publicodes/mip-rules'
import { getRuleCategoryKey } from '@abc-transitionbascarbone/publicodes/form/utils'
import { EvaluatedFormElement, FormPageElementProp, getEvaluatedFormElement } from '@publicodes/forms'

type SurveyFormElement = EvaluatedFormElement<string> & FormPageElementProp

type GroupedSingleElement = {
  type: 'single'
  el: SurveyFormElement
  questionType: MipQuestionType
  plancherWarning: string | null
}

type GroupedMosaicElement = {
  type: 'mosaic'
  parent: string
  elements: SurveyFormElement[]
  plancherWarning: string | null
}

export type GroupedElement = GroupedSingleElement | GroupedMosaicElement

type MipEngine = ReturnType<typeof createMipEngine>

const evaluateFormElement = (engine: MipEngine, ruleName: string): SurveyFormElement =>
  ({
    ...getEvaluatedFormElement(engine, ruleName),
    hidden: false,
    useful: true,
    disabled: false,
    autofocus: false,
  }) as SurveyFormElement

const patchFormElement = (el: SurveyFormElement, questionType: MipQuestionType): SurveyFormElement => {
  if (el.element !== 'input') {
    return el
  }

  switch (questionType) {
    case MipQuestionType.Boolean:
      return {
        ...el,
        element: 'RadioGroup',
        options: [
          { label: 'Oui', value: true },
          { label: 'Non', value: false },
        ],
      } as unknown as SurveyFormElement
    case MipQuestionType.Choices:
      return { ...el, element: 'select' } as unknown as SurveyFormElement
    default:
      return el
  }
}

const getGroupedElementRuleName = (groupedElement?: GroupedElement): string | null => {
  if (!groupedElement) {
    return null
  }

  if (groupedElement.type === 'single') {
    return groupedElement.el.id
  }

  return groupedElement.elements[0]?.id ?? groupedElement.parent
}

export const buildGroupedElements = (
  engine: MipEngine,
  currentQuestion: string | null,
  mosaicChildrenWithParent: Record<string, string[]>,
): GroupedElement[] => {
  if (!currentQuestion) {
    return []
  }

  const mosaicChildren = mosaicChildrenWithParent[currentQuestion]
  if (mosaicChildren) {
    const elements = mosaicChildren.map((ruleName) => evaluateFormElement(engine, ruleName))
    return elements.length
      ? [
          {
            type: 'mosaic',
            parent: currentQuestion,
            elements,
            plancherWarning: getPlancherWarning(engine, currentQuestion),
          },
        ]
      : []
  }

  const questionType = getQuestionType(engine, currentQuestion)
  const el = evaluateFormElement(engine, currentQuestion)
  return [
    {
      type: 'single',
      el: patchFormElement(el, questionType),
      questionType,
      plancherWarning: getPlancherWarning(engine, currentQuestion),
    },
  ]
}

export const getCategoryKey = (groupedElements: GroupedElement[]): string | null => {
  const ruleName = getGroupedElementRuleName(groupedElements[0])
  return ruleName ? getRuleCategoryKey(ruleName) : null
}

export const getCurrentSectionTitle = (engine: MipEngine, groupedElements: GroupedElement[]) => {
  const categoryKey = getCategoryKey(groupedElements)
  const raw = categoryKey ? engine.getParsedRules()[categoryKey]?.rawNode : undefined
  return { label: raw?.titre ?? '', icons: raw?.icônes }
}
