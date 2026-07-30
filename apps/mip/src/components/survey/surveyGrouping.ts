import { createMipEngine } from '@/publicodes/mip-engine'
import {
  getMosaicParent,
  getQuestionType,
  getRuleCategoryKey,
  MipQuestionType,
  patchFormElement,
} from '@abc-transitionbascarbone/publicodes/form'
import { EvaluatedFormElement, FormPageElementProp } from '@publicodes/forms'

type SurveyFormElement = EvaluatedFormElement<string> & FormPageElementProp

type GroupedSingleElement = {
  type: 'single'
  el: SurveyFormElement
  questionType: MipQuestionType
}

type GroupedMosaicElement = {
  type: 'mosaic'
  parent: string
  elements: SurveyFormElement[]
}

export type GroupedElement = GroupedSingleElement | GroupedMosaicElement

type MipEngine = ReturnType<typeof createMipEngine>

const getGroupedElementRuleName = (groupedElement?: GroupedElement): string | null => {
  if (!groupedElement) {
    return null
  }

  if (groupedElement.type === 'single') {
    return groupedElement.el.id
  }

  return groupedElement.elements[0]?.id ?? groupedElement.parent
}

export const buildGroupedElements = (engine: MipEngine, elements: SurveyFormElement[]): GroupedElement[] => {
  const groupedElements: GroupedElement[] = []
  const mosaicGroupsByParent = new Map<string, GroupedMosaicElement>()

  for (const el of elements) {
    const mosaicParent = getMosaicParent(engine, el.id)
    if (mosaicParent) {
      const existingGroup = mosaicGroupsByParent.get(mosaicParent)
      if (existingGroup) {
        existingGroup.elements.push(el)
      } else {
        const newGroup: GroupedMosaicElement = {
          type: 'mosaic',
          parent: mosaicParent,
          elements: [el],
        }
        mosaicGroupsByParent.set(mosaicParent, newGroup)
        groupedElements.push(newGroup)
      }
      continue
    }

    const questionType = getQuestionType(engine, el.id)
    groupedElements.push({
      type: 'single',
      el: patchFormElement(el, questionType),
      questionType,
    })
  }

  return groupedElements
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
