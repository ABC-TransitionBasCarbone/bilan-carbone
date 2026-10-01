import { getSurveyCategoryKeysFromParsedRules } from '@/publicodes/mip-engine'
import { getRuleCategoryKey, getRuleSubCategoryKey } from '@abc-transitionbascarbone/publicodes/form/utils'
import { safeEvaluate } from '@abc-transitionbascarbone/publicodes/utils'
import Engine, { Situation, utils } from 'publicodes'

type RuleRawNode = {
  question?: unknown
  mosaique?: { options?: string[] }
  unité?: unknown
  'une possibilité'?: unknown
  ordre?: number | string
  plancher?: number
  avertissement?: string
  formule?: unknown
  somme?: unknown
  variations?: unknown
  'applicable si'?: unknown
  'non applicable si'?: unknown
}

type ParsedRules = Record<string, { rawNode?: RuleRawNode }>

export enum MipQuestionType {
  NoRenderableQuestion = 'noRenderableQuestion',
  Mosaic = 'mosaic',
  Choices = 'choices',
  Boolean = 'boolean',
  Number = 'number',
}

export type MissingVariables = Record<string, number>

export type MipRulesMeta = {
  root: string
  everyQuestions: string[]
  mosaicChildrenWithParent: Record<string, string[]>
  categories: string[]
  subcategories: string[]
  rawMissingVariables: MissingVariables
}

type SommeVariations = Array<{ alors?: { somme?: string[] } }>

const MAX = Number.MAX_SAFE_INTEGER

const getParsedRules = (engine: Engine) => engine.getParsedRules() as ParsedRules

const booleanSecureTypes = ['présent', 'propriétaire']

const getChoiceOption = (rawNode?: RuleRawNode): unknown => {
  const formula = rawNode?.formule
  const source = formula && typeof formula === 'object' ? (formula as Record<string, unknown>) : rawNode
  return source && Object.hasOwn(source, 'une possibilité') ? source['une possibilité'] : undefined
}

export const getQuestionType = (engine: Engine, ruleName: string): MipQuestionType => {
  const rules = getParsedRules(engine)
  const rule = rules[ruleName]

  if (!rule?.rawNode?.question) {
    return MipQuestionType.NoRenderableQuestion
  }
  if (rule.rawNode.mosaique) {
    return MipQuestionType.Mosaic
  }

  const evaluation = engine.evaluate(ruleName)
  const unePossibilite = getChoiceOption(rule.rawNode)

  if (
    (rule.rawNode.unité === undefined && typeof evaluation.nodeValue !== 'number') ||
    booleanSecureTypes.some((key) => ruleName.includes(key))
  ) {
    return unePossibilite ? MipQuestionType.Choices : MipQuestionType.Boolean
  }

  return MipQuestionType.Number
}

// Optimized models unfold `formule`, so `somme` can sit at the root, in `formule` or in `variations`.
export const getSomme = (rawNode?: RuleRawNode): string[] | undefined => {
  if (!rawNode) {
    return undefined
  }
  const source = rawNode.formule && typeof rawNode.formule === 'object' ? (rawNode.formule as RuleRawNode) : rawNode
  if (Array.isArray(source.somme)) {
    return source.somme as string[]
  }
  if (Array.isArray(source.variations)) {
    return (source.variations as SommeVariations)[0]?.alors?.somme
  }
  return undefined
}

const disambiguate = (engine: Engine, referencedIn: string, names: string[]): string[] =>
  names.map((name) => utils.disambiguateReference(engine.getParsedRules(), referencedIn, name))

export const getEveryQuestions = (engine: Engine): string[] =>
  Object.entries(getParsedRules(engine))
    .filter(([, rule]) => rule.rawNode?.question)
    .map(([ruleName]) => ruleName)

export const getMosaicChildrenWithParent = (engine: Engine): Record<string, string[]> =>
  Object.fromEntries(
    Object.entries(getParsedRules(engine))
      .filter(([, rule]) => rule.rawNode?.mosaique?.options)
      .map(([ruleName, rule]) => [ruleName, disambiguate(engine, ruleName, rule.rawNode?.mosaique?.options ?? [])]),
  )

export const getSubcategories = (engine: Engine, categories: string[]): string[] =>
  categories.flatMap((category) =>
    disambiguate(engine, category, getSomme(getParsedRules(engine)[category]?.rawNode) ?? []),
  )

const getRootMissingVariables = (engine: Engine, root: string): MissingVariables => {
  try {
    return engine.evaluate(root).missingVariables
  } catch {
    return {}
  }
}

const isApplicable = (engine: Engine, ruleName: string): boolean => {
  try {
    return engine.evaluate({ 'est applicable': ruleName }).nodeValue === true
  } catch {
    return false
  }
}

// Unconditional questions stay relevant once answered, even if their own answer disables them.
const getRawMissingVariables = (engine: Engine, root: string, everyQuestions: string[]): MissingVariables => {
  const rules = getParsedRules(engine)
  const pristineEngine = engine.shallowCopy().setSituation({})
  return Object.fromEntries(
    Object.entries(getRootMissingVariables(pristineEngine, root)).filter(
      ([ruleName]) =>
        everyQuestions.includes(ruleName) &&
        rules[ruleName]?.rawNode?.['applicable si'] === undefined &&
        rules[ruleName]?.rawNode?.['non applicable si'] === undefined,
    ),
  )
}

export const getRulesMeta = (engine: Engine, root = 'bilan'): MipRulesMeta => {
  const everyQuestions = getEveryQuestions(engine)
  const categories = getSurveyCategoryKeysFromParsedRules(engine.getParsedRules())
  return {
    root,
    everyQuestions,
    mosaicChildrenWithParent: getMosaicChildrenWithParent(engine),
    categories,
    subcategories: getSubcategories(engine, categories),
    rawMissingVariables: getRawMissingVariables(engine, root, everyQuestions),
  }
}

export const getIsMissing = (ruleName: string, situation: Situation<string>, mosaicChildren: string[] = []): boolean =>
  [ruleName, ...mosaicChildren].every((name) => !situation[name] && situation[name] !== 0)

export const hasRuleAnswer = (
  ruleName: string,
  situation: Situation<string>,
  mosaicChildrenWithParent: Record<string, string[]> = {},
): boolean => {
  const relatedRules = [ruleName, ...(mosaicChildrenWithParent[ruleName] ?? [])]
  return relatedRules.some((name) => {
    const value = situation[name]
    return value !== undefined && value !== null
  })
}

// Mosaic children are replaced by their parent, scored with the max of its children.
export const getMissingVariables = (engine: Engine, meta: MipRulesMeta): MissingVariables => {
  const missingVariables = Object.fromEntries(
    Object.entries(getRootMissingVariables(engine, meta.root)).filter(([ruleName]) =>
      meta.everyQuestions.includes(ruleName),
    ),
  )

  for (const [parent, children] of Object.entries(meta.mosaicChildrenWithParent)) {
    const scores = children.map((child) => missingVariables[child]).filter((score) => score !== undefined)
    if (scores.length > 0) {
      missingVariables[parent] = Math.max(...scores)
      children.forEach((child) => delete missingVariables[child])
    }
  }

  return missingVariables
}

const getRuleOrder = (rawNode?: RuleRawNode): number => {
  const value = typeof rawNode?.ordre === 'number' ? rawNode.ordre : Number.parseFloat(rawNode?.ordre ?? '')
  return Number.isFinite(value) ? value : MAX
}

const getIndex = (list: string[], value: string): number => {
  const index = list.indexOf(value)
  return index === -1 ? MAX : index
}

export const sortQuestions = (
  engine: Engine,
  questions: string[],
  meta: MipRulesMeta,
  missingVariables: MissingVariables,
): string[] => {
  const rules = getParsedRules(engine)
  return [...questions].sort((a, b) => {
    const categoryDiff =
      getIndex(meta.categories, getRuleCategoryKey(a)) - getIndex(meta.categories, getRuleCategoryKey(b))
    if (categoryDiff !== 0) {
      return categoryDiff
    }

    const orderDiff = getRuleOrder(rules[a]?.rawNode) - getRuleOrder(rules[b]?.rawNode)
    if (orderDiff !== 0) {
      return orderDiff
    }

    if (meta.mosaicChildrenWithParent[a] && b.startsWith(`${a} . `)) {
      return -1
    }
    if (meta.mosaicChildrenWithParent[b] && a.startsWith(`${b} . `)) {
      return 1
    }

    return (
      getIndex(meta.subcategories, getRuleSubCategoryKey(a)) - getIndex(meta.subcategories, getRuleSubCategoryKey(b)) ||
      (missingVariables[b] ?? 0) - (missingVariables[a] ?? 0)
    )
  })
}

export const getFormQuestions = (engine: Engine, meta: MipRulesMeta, foldedSteps: string[]) => {
  const situation = engine.getSituation()
  const missingVariables = getMissingVariables(engine, meta)
  const mosaicChildren = new Set(Object.values(meta.mosaicChildrenWithParent).flat())

  const remainingQuestions = sortQuestions(
    engine,
    meta.everyQuestions.filter(
      (question) => !mosaicChildren.has(question) && !foldedSteps.includes(question) && question in missingVariables,
    ),
    meta,
    missingVariables,
  )

  const relevantAnsweredQuestions = foldedSteps.filter(
    (foldedStep) =>
      meta.everyQuestions.includes(foldedStep) &&
      (foldedStep in meta.rawMissingVariables || isApplicable(engine, foldedStep)),
  )

  const relevantQuestions = sortQuestions(
    engine,
    [
      ...new Set([
        ...relevantAnsweredQuestions,
        ...remainingQuestions.filter((question) =>
          getIsMissing(question, situation, meta.mosaicChildrenWithParent[question]),
        ),
      ]),
    ],
    meta,
    missingVariables,
  )

  return { missingVariables, remainingQuestions, relevantAnsweredQuestions, relevantQuestions }
}

export const getStableQuestionOrder = (
  currentOrder: string[],
  currentQuestion: string | null,
  availableQuestions: string[],
  sortedQuestions: string[],
  mosaicChildrenWithParent: Record<string, string[]> = {},
): string[] => {
  const available = new Set(availableQuestions)
  const order = currentOrder.filter((question) => available.has(question))
  const additions = sortedQuestions.filter((question) => available.has(question) && !order.includes(question))

  if (currentOrder.length === 0) {
    order.push(...additions)
  } else if (additions.length > 0) {
    const activeIndex = currentQuestion ? order.indexOf(currentQuestion) : -1
    order.splice(activeIndex >= 0 ? activeIndex + 1 : order.length, 0, ...additions)
  }

  const sortedIndex = new Map(sortedQuestions.map((question, index) => [question, index]))
  const parents = Object.entries(mosaicChildrenWithParent).sort(
    ([parentA], [parentB]) => parentB.split(' . ').length - parentA.split(' . ').length,
  )

  for (const [parent, children] of parents) {
    const branches = children.map((child) => child.split(' . ').slice(0, -1).join(' . '))
    const isBranchQuestion = (question: string) => branches.some((branch) => question.startsWith(`${branch} . `))
    const groupedQuestions = new Set(
      sortedQuestions.filter((question) => available.has(question) && isBranchQuestion(question)),
    )
    if (groupedQuestions.size === 0) {
      continue
    }

    const previousIndex = new Map(order.map((question, index) => [question, index]))
    const groups = new Map<string, string[]>()
    for (const branch of branches) {
      const branchQuestions = [...groupedQuestions].filter((question) => question.startsWith(`${branch} . `))
      if (branchQuestions.length > 0) {
        branchQuestions.sort(
          (a, b) =>
            (previousIndex.get(a) ?? Number.MAX_SAFE_INTEGER) - (previousIndex.get(b) ?? Number.MAX_SAFE_INTEGER) ||
            (sortedIndex.get(a) ?? Number.MAX_SAFE_INTEGER) - (sortedIndex.get(b) ?? Number.MAX_SAFE_INTEGER),
        )
        groups.set(branch, branchQuestions)
      }
    }

    const orderedGroups = [...groups.entries()].sort(([, questionsA], [, questionsB]) => {
      const previousA = Math.min(
        ...questionsA.map((question) => previousIndex.get(question) ?? Number.MAX_SAFE_INTEGER),
      )
      const previousB = Math.min(
        ...questionsB.map((question) => previousIndex.get(question) ?? Number.MAX_SAFE_INTEGER),
      )
      return (
        previousA - previousB ||
        (sortedIndex.get(questionsA[0]) ?? Number.MAX_SAFE_INTEGER) -
          (sortedIndex.get(questionsB[0]) ?? Number.MAX_SAFE_INTEGER)
      )
    })
    const grouped = new Set(orderedGroups.flatMap(([, questions]) => questions))
    const ungroupedOrder = order.filter((question) => !grouped.has(question))
    const parentIndex = ungroupedOrder.indexOf(parent)
    if (parentIndex >= 0) {
      ungroupedOrder.splice(parentIndex + 1, 0, ...orderedGroups.flatMap(([, questions]) => questions))
      order.splice(0, order.length, ...ungroupedOrder)
    }
  }

  return order
}

export const getNextQuestion = (currentQuestion: string | null, orderedQuestions: string[]): string | null => {
  const currentIndex = currentQuestion ? orderedQuestions.indexOf(currentQuestion) : -1
  return orderedQuestions[currentIndex + 1] ?? null
}

// Unanswered mosaic siblings are set to a neutral value so the mosaic stops being missing.
export const getMosaicResetSituation = (
  engine: Engine,
  mosaicChildren: string[],
  situation: Situation<string>,
): Situation<string> =>
  Object.fromEntries(
    mosaicChildren
      .filter((child) => getIsMissing(child, situation))
      .map((child) => [child, getQuestionType(engine, child) === MipQuestionType.Boolean ? 'non' : 0]),
  )

// `plancher` clamps the evaluated value, so the raw situation input is compared instead.
export const getPlancherWarning = (engine: Engine, ruleName: string): string | null => {
  const rawNode = getParsedRules(engine)[ruleName]?.rawNode
  if (rawNode?.plancher === undefined || !rawNode.avertissement) {
    return null
  }
  const value = Number(engine.getSituation()[ruleName])
  return Number.isFinite(value) && value < rawNode.plancher ? rawNode.avertissement : null
}

export const getActions = (engine: Engine, actionsRule = 'actions'): string[] => {
  const somme = getSomme(getParsedRules(engine)[actionsRule]?.rawNode)
  if (!somme) {
    return []
  }
  return disambiguate(engine, actionsRule, somme)
    .map((action) => ({ action, value: safeEvaluate(engine, action) }))
    .sort((a, b) => b.value - a.value)
    .map(({ action }) => action)
}
