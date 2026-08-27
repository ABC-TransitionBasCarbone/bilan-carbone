import { Question, Survey, SurveyResponse } from '@abc-transitionbascarbone/typeguards'
import { isObject } from '@abc-transitionbascarbone/utils/object'
import Engine, { parsePublicodes } from 'publicodes'

export type RawRules = Parameters<typeof parsePublicodes>[0]

export class SurveyEngine {
  private survey: Survey
  private response: SurveyResponse

  constructor(survey: Survey, response: SurveyResponse) {
    this.survey = survey
    this.response = response
  }

  getCurrentQuestion(): Question | null {
    if (this.response.currentQuestionIndex < 0 || this.response.currentQuestionIndex >= this.survey.questions.length) {
      return null
    }
    return this.survey.questions[this.response.currentQuestionIndex]
  }

  hasNextQuestion(): boolean {
    return this.response.currentQuestionIndex < this.survey.questions.length - 1
  }

  hasPreviousQuestion(): boolean {
    return this.response.currentQuestionIndex > 0
  }

  goToNextQuestion(): number {
    if (this.hasNextQuestion()) {
      this.response.currentQuestionIndex++
    }
    return this.response.currentQuestionIndex
  }

  goToPreviousQuestion(): number {
    if (this.hasPreviousQuestion()) {
      this.response.currentQuestionIndex--
    }
    return this.response.currentQuestionIndex
  }

  validateAnswer(question: Question, answer: string | string[] | number): string | null {
    if (question.required) {
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        return 'This question is required'
      }
      if (typeof answer === 'string' && answer.trim() === '') {
        return 'This question is required'
      }
    }

    if (question.type === 'text' && typeof answer === 'string') {
      const { validation } = question
      if (validation) {
        if (validation.minLength && answer.length < validation.minLength) {
          return `Answer must be at least ${validation.minLength} characters`
        }
        if (validation.maxLength && answer.length > validation.maxLength) {
          return `Answer must be at most ${validation.maxLength} characters`
        }
        if (validation.pattern) {
          const regex = new RegExp(validation.pattern)
          if (!regex.test(answer)) {
            return 'Answer format is invalid'
          }
        }
      }
    }

    if (question.type === 'choice') {
      const validValues = question.options.map((opt) => opt.value)
      if (Array.isArray(answer)) {
        const invalidValues = answer.filter((val) => !validValues.includes(val))
        if (invalidValues.length > 0) {
          return 'Invalid choice selected'
        }
      } else if (typeof answer === 'string' && !validValues.includes(answer)) {
        return 'Invalid choice selected'
      }
    }

    return null
  }

  setAnswer(answer: string | string[] | number): void {
    const currentQuestion = this.getCurrentQuestion()
    if (currentQuestion) {
      this.response.answers[currentQuestion.id] = answer
      this.response.updatedAt = new Date()
    }
  }

  getAnswer(questionId: string): string | string[] | number | undefined {
    return this.response.answers[questionId]
  }

  isComplete(): boolean {
    return this.response.currentQuestionIndex >= this.survey.questions.length
  }

  complete(): void {
    this.response.completed = true
    this.response.completedAt = new Date()
    this.response.updatedAt = new Date()
    this.response.currentQuestionIndex = this.survey.questions.length
  }

  getProgress(): number {
    if (this.survey.questions.length === 0) {
      return 0
    }
    if (this.response.completed) {
      return 100
    }
    const answeredCount = Math.min(this.response.currentQuestionIndex + 1, this.survey.questions.length)
    return Math.round((answeredCount / this.survey.questions.length) * 100)
  }

  getResponse(): SurveyResponse {
    return this.response
  }

  getSurvey(): Survey {
    return this.survey
  }
}

const RULE_NAME_SEPARATOR = ' . '

const ORDERED_SURVEY_CATEGORY_KEYS = ['DT', 'transport', 'alimentation', 'numérique', 'bureaux'] as const

const normalizeSurveyCategoryKeyForOrder = (key: string): string => {
  if (key === 'divers') {
    return 'numérique'
  }
  if (key === 'logement') {
    return 'bureaux'
  }
  return key
}

const getSurveyCategoryKeysFromCanonicalOrder = (rules: Record<string, unknown>): string[] => {
  return ORDERED_SURVEY_CATEGORY_KEYS.flatMap((key) => {
    const actualKey = key === 'numérique' ? 'divers' : key === 'bureaux' ? 'logement' : key
    return actualKey in rules ? [actualKey] : []
  })
}

const getMissingParentRuleNames = (rules: Record<string, unknown>): string[] => {
  const existing = new Set(Object.keys(rules))
  const missing = new Set<string>()

  for (const ruleName of existing) {
    const parts = ruleName.split(RULE_NAME_SEPARATOR)
    if (parts.length < 2) {
      continue
    }

    for (let depth = 1; depth < parts.length; depth++) {
      const parentName = parts.slice(0, depth).join(RULE_NAME_SEPARATOR)
      if (!existing.has(parentName)) {
        missing.add(parentName)
      }
    }
  }

  return [...missing]
}

const normalizeRulesWithMissingParents = (rules: RawRules): RawRules => {
  if (!isObject(rules)) {
    return rules
  }

  const normalizedRules: Record<string, unknown> = { ...rules }
  const missingParents = getMissingParentRuleNames(normalizedRules)

  for (const parentName of missingParents) {
    // Publicodes requires every dotted rule to have its parent namespace declared.
    normalizedRules[parentName] = {}
  }

  return normalizedRules as RawRules
}

export function createMipEngine(rules: RawRules): Engine {
  return new Engine(normalizeRulesWithMissingParents(rules), {
    flag: { filterNotApplicablePossibilities: true },
  })
}

const orderSurveyCategoryKeys = (keys: string[]): string[] => {
  const rankingByKey = new Map<string, number>(
    ORDERED_SURVEY_CATEGORY_KEYS.map((key, index) => [normalizeSurveyCategoryKeyForOrder(key), index]),
  )

  return [...keys].sort((left, right) => {
    const leftRank = rankingByKey.get(normalizeSurveyCategoryKeyForOrder(left))
    const rightRank = rankingByKey.get(normalizeSurveyCategoryKeyForOrder(right))

    if (leftRank === undefined && rightRank === undefined) {
      return 0
    }
    if (leftRank === undefined) {
      return 1
    }
    if (rightRank === undefined) {
      return -1
    }
    return leftRank - rightRank
  })
}

const getSurveyCategoryKeysFromRules = (rules: Record<string, unknown>): string[] => {
  const bilanRule = rules.bilan
  const bilanSum =
    isObject(bilanRule) && Array.isArray(bilanRule.somme)
      ? bilanRule.somme
      : isObject(bilanRule) && isObject(bilanRule.rawNode) && Array.isArray(bilanRule.rawNode.somme)
        ? bilanRule.rawNode.somme
        : undefined

  if (bilanSum) {
    const categoryKeys = new Set<string>()

    for (const value of bilanSum) {
      if (typeof value !== 'string') {
        continue
      }

      const ruleName = value.trim()
      if (!ruleName || ruleName.includes(RULE_NAME_SEPARATOR)) {
        continue
      }

      categoryKeys.add(ruleName)
    }

    if (categoryKeys.size > 0) {
      return orderSurveyCategoryKeys([...categoryKeys])
    }
  }

  return orderSurveyCategoryKeys(getSurveyCategoryKeysFromCanonicalOrder(rules))
}

export const getSurveyCategoryKeysFromRawRules = (rules: RawRules): string[] => {
  return getSurveyCategoryKeysFromRules(rules as Record<string, unknown>)
}

export const getSurveyCategoryKeysFromParsedRules = (parsedRules: ReturnType<Engine['getParsedRules']>): string[] => {
  return getSurveyCategoryKeysFromRules(parsedRules as Record<string, unknown>)
}
