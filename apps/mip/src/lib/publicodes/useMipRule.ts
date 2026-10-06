import { getUpdatedSituationWithInputValue } from '@abc-transitionbascarbone/common/publicodes/form/utils'
import { useMipPublicodes } from './MipPublicodesProvider'
import { getFormQuestions, getMosaicResetSituation, getPlancherWarning, getQuestionType } from './mip-rules'

export const useMipRule = (ruleName: string) => {
  const { engine, meta, simulation, currentQuestion, setCurrentQuestion, updateSimulation, safeEvaluate, safeGetRule } =
    useMipPublicodes()
  const rule = safeGetRule(ruleName) as { rawNode?: { suggestions?: Record<string, unknown> } } | undefined
  const value = safeEvaluate(ruleName)?.nodeValue

  const setValue = (inputValue: string | number | boolean | undefined, targetRuleName = ruleName) => {
    const situation = getUpdatedSituationWithInputValue(engine, simulation.situation, targetRuleName, inputValue)
    const mosaicParent = Object.entries(meta.mosaicChildrenWithParent).find(([, children]) =>
      children.includes(targetRuleName),
    )
    const mosaicChildren = mosaicParent?.[1] ?? []
    const nextSituation = {
      ...situation,
      ...getMosaicResetSituation(engine, mosaicChildren, situation),
    }
    const nextEngine = engine.shallowCopy().setSituation(nextSituation)
    const questions = getFormQuestions(nextEngine, meta, simulation.foldedSteps)
    const progression = questions.relevantQuestions.length
      ? Math.round((questions.relevantAnsweredQuestions.length / questions.relevantQuestions.length) * 100)
      : 0

    const activeQuestion = (currentQuestion ?? ruleName) || targetRuleName
    if (!currentQuestion && activeQuestion) {
      setCurrentQuestion(activeQuestion)
    }
    updateSimulation({ situation: nextSituation, progression }, activeQuestion)
  }

  return {
    type: getQuestionType(engine, ruleName),
    value,
    plancherWarning: getPlancherWarning(engine, ruleName),
    suggestions: rule?.rawNode?.suggestions,
    setValue,
  }
}
