import { sortFieldsByModelOrder } from '@/publicodes/mip-survey-order'
import { getMosaicParent } from '@abc-transitionbascarbone/publicodes/form/utils'
import { EvaluatedFormElement, FormPageElementProp, FormPages } from '@publicodes/forms'
import Engine from 'publicodes'

type ParsedRuleRawNode = {
  question?: unknown
  mosaique?: { options?: string[] }
  ordre?: number | string
  [key: string]: unknown
}

type ParsedRule = {
  rawNode?: ParsedRuleRawNode
  [key: string]: unknown
}

type ParsedRules = Record<string, ParsedRule>

const isRuleApplicable = (engine: Engine, ruleName: string): boolean => {
  const mosaicParent = getMosaicParent(engine, ruleName)
  return engine.evaluate({ 'est applicable': mosaicParent ?? ruleName }).nodeValue !== false
}

export const sortFieldsForPageBuilder = (engine: Engine, fields: string[]): string[] => {
  return sortFieldsByModelOrder(engine, fields).filter((field) => isRuleApplicable(engine, field))
}

export const buildPageBuilder = (engine: Engine, fields: string[]): FormPages<string> => {
  const rules = engine.getParsedRules() as ParsedRules
  const sortedFields = sortFieldsForPageBuilder(engine, fields)

  const pages: FormPages<string> = []
  const mosaicPagesByParent = new Map<string, FormPages<string>[number]>()

  for (const field of sortedFields) {
    const mosaicParent = getMosaicParent(engine, field)
    if (!mosaicParent) {
      pages.push({ elements: [field] })
      continue
    }

    const existingPage = mosaicPagesByParent.get(mosaicParent)
    if (existingPage) {
      existingPage.elements.push(field)
    } else {
      const newPage = {
        elements: [field],
        title:
          typeof rules[mosaicParent]?.rawNode?.question === 'string' ? rules[mosaicParent].rawNode.question : undefined,
      }
      mosaicPagesByParent.set(mosaicParent, newPage)
      pages.push(newPage)
    }
  }

  return pages
}

export enum MipQuestionType {
  NoRenderableQuestion = 'noRenderableQuestion',
  Mosaic = 'mosaic',
  Choices = 'choices',
  Boolean = 'boolean',
  Number = 'number',
}

const booleanSecureTypes = ['présent', 'propriétaire']

const getChoiceOption = (rawNode: ParsedRuleRawNode | undefined): unknown => {
  const formula = rawNode?.formule
  const source = formula && typeof formula === 'object' ? (formula as Record<string, unknown>) : rawNode
  return source && Object.hasOwn(source, 'une possibilité') ? source['une possibilité'] : undefined
}

export const getQuestionType = (engine: Engine, ruleName: string): MipQuestionType => {
  const rules = engine.getParsedRules() as ParsedRules
  const rule = rules[ruleName]

  if (!rule) {
    return MipQuestionType.NoRenderableQuestion
  }

  const raw = rule.rawNode
  if (!raw?.question) {
    return MipQuestionType.NoRenderableQuestion
  }
  if (raw.mosaique) {
    return MipQuestionType.Mosaic
  }

  const evaluation = engine.evaluate(ruleName)
  const unePossibilite = getChoiceOption(raw)

  if (
    (raw.unité === undefined && typeof evaluation.nodeValue !== 'number') ||
    booleanSecureTypes.some((key) => ruleName.includes(key))
  ) {
    return unePossibilite ? MipQuestionType.Choices : MipQuestionType.Boolean
  }

  return MipQuestionType.Number
}

type PatchedFormElement<RuleName extends string> = EvaluatedFormElement<RuleName> & FormPageElementProp

export const patchFormElement = <RuleName extends string>(
  el: EvaluatedFormElement<RuleName> & FormPageElementProp,
  questionType: MipQuestionType,
): PatchedFormElement<RuleName> => {
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
      } as unknown as PatchedFormElement<RuleName>
    case MipQuestionType.Choices:
      return { ...el, element: 'select' } as unknown as PatchedFormElement<RuleName>
    default:
      return el
  }
}
