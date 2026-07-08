import { createMipEngine } from '@/publicodes/mip-engine'
import {
  getMosaicParent,
  getQuestionType,
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

export const buildGroupedElements = (engine: MipEngine, elements: SurveyFormElement[]): GroupedElement[] => {
  const groupedElements: GroupedElement[] = []
  const seen = new Set<string>()

  for (const el of elements) {
    const mosaicParent = getMosaicParent(engine, el.id)
    if (mosaicParent) {
      if (!seen.has(mosaicParent)) {
        seen.add(mosaicParent)
        groupedElements.push({
          type: 'mosaic',
          parent: mosaicParent,
          elements: elements.filter((element) => getMosaicParent(engine, element.id) === mosaicParent),
        })
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

export const getCurrentSectionTitle = (engine: MipEngine, groupedElements: GroupedElement[]) => {
  const getCategoryKey = (ruleName: string) => ruleName.split(' . ')[0]

  if (groupedElements[0]?.type === 'mosaic') {
    const key = getCategoryKey(groupedElements[0].parent)
    const raw = engine.getParsedRules()[key]?.rawNode
    return { label: raw?.titre ?? '', icons: raw?.icônes }
  }

  if (groupedElements[0]?.type === 'single') {
    const key = getCategoryKey(groupedElements[0].el.id)
    const raw = engine.getParsedRules()[key]?.rawNode
    return { label: raw?.titre ?? '', icons: raw?.icônes }
  }

  return { label: '', icons: undefined }
}
