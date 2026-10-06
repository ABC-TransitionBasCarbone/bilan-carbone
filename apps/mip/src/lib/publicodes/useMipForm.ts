import { getRuleCategoryKey } from '@abc-transitionbascarbone/common/publicodes/form/utils'
import { getFormQuestions, getNextQuestion } from './mip-rules'
import { useMipPublicodes } from './MipPublicodesProvider'

export const useMipForm = () => {
  const { engine, meta, simulation, currentQuestion, setCurrentQuestion, updateSimulation } = useMipPublicodes()
  const { remainingQuestions: sortedRemaining, relevantQuestions: sortedRelevant } = getFormQuestions(
    engine,
    meta,
    simulation.foldedSteps,
  )
  const questionIndex = new Map(simulation.questionOrder.map((question, index) => [question, index]))
  const sortByQuestionOrder = (questions: string[]) =>
    [...questions].sort(
      (a, b) => (questionIndex.get(a) ?? Number.MAX_SAFE_INTEGER) - (questionIndex.get(b) ?? Number.MAX_SAFE_INTEGER),
    )
  const remainingQuestions = sortByQuestionOrder(sortedRemaining)
  const relevantQuestions = sortByQuestionOrder(sortedRelevant)
  const activeQuestion =
    currentQuestion && relevantQuestions.includes(currentQuestion)
      ? currentQuestion
      : (remainingQuestions[0] ?? relevantQuestions[relevantQuestions.length - 1] ?? null)
  const currentIndex = activeQuestion ? relevantQuestions.indexOf(activeQuestion) : -1
  const currentCategory = activeQuestion ? getRuleCategoryKey(activeQuestion) : null
  const categoryQuestions = currentCategory
    ? relevantQuestions.filter((question) => getRuleCategoryKey(question) === currentCategory)
    : []
  const progression = currentIndex >= 0 ? Math.round(((currentIndex + 1) / relevantQuestions.length) * 100) : 0

  const goToNextQuestion = () => {
    const nextQuestion = getNextQuestion(activeQuestion, relevantQuestions)
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion)
      if (activeQuestion) {
        const foldedSteps = [...new Set([...simulation.foldedSteps, activeQuestion])]
        updateSimulation({ foldedSteps, progression })
      }
    }
  }

  const goToPreviousQuestion = () => {
    const previousQuestion = relevantQuestions[currentIndex - 1]
    if (previousQuestion) {
      setCurrentQuestion(previousQuestion)
      updateSimulation({ progression })
    }
  }

  return {
    remainingQuestions,
    relevantQuestions,
    currentQuestion: activeQuestion,
    currentCategory,
    progression,
    firstQuestionOfCategory: categoryQuestions[0] ?? null,
    lastQuestionOfCategory: categoryQuestions[categoryQuestions.length - 1] ?? null,
    isFirstQuestionOfCategory: activeQuestion !== null && activeQuestion === categoryQuestions[0],
    goToNextQuestion,
    goToPreviousQuestion,
  }
}
