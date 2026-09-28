'use client'
import { clearSurveyState, loadSurveyState, saveSurveyState } from '@/components/survey/surveyStateStorage'
import { parseMipSimulationState, type MipSimulationState } from '@/utils/survey'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createMipEngine, RawRules } from './mip-engine'
import { getFormQuestions, getRulesMeta, getStableQuestionOrder, sortQuestions } from './mip-rules'

const emptySimulationState = (): MipSimulationState => ({
  situation: {},
  foldedSteps: [],
  actionChoices: {},
  progression: 0,
  questionOrder: [],
})

interface MipPublicodesContextValue {
  surveyId: string
  engine: ReturnType<typeof createMipEngine>
  meta: ReturnType<typeof getRulesMeta>
  simulation: MipSimulationState
  currentQuestion: string | null
  setCurrentQuestion: (question: string | null) => void
  updateSimulation: (updates: Partial<MipSimulationState>) => void
  resetSimulation: () => void
}

const MipPublicodesContext = createContext<MipPublicodesContextValue | null>(null)

export function MipPublicodesProvider({
  children,
  model,
  surveyId,
}: {
  children: ReactNode
  model: RawRules
  surveyId: string
}) {
  const engine = useMemo(() => createMipEngine(model), [model])
  const meta = useMemo(() => getRulesMeta(engine), [engine])
  const [simulation, setSimulation] = useState<MipSimulationState>(emptySimulationState)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const simulationRef = useRef(simulation)
  const hydratedRef = useRef(false)
  const pendingUpdatesRef = useRef<Partial<MipSimulationState>>({})

  useEffect(() => {
    const storedState = loadSurveyState<unknown>(surveyId)
    const loadedState = storedState ? parseMipSimulationState(storedState) : emptySimulationState()
    const loadedStateWithPendingUpdates = { ...loadedState, ...pendingUpdatesRef.current }
    engine.setSituation(loadedStateWithPendingUpdates.situation)
    const questions = getFormQuestions(engine, meta, loadedStateWithPendingUpdates.foldedSteps)
    const availableQuestions = [...new Set([...questions.relevantQuestions, ...questions.remainingQuestions])]
    const sortedQuestions = sortQuestions(engine, availableQuestions, meta, questions.missingVariables)
    const nextOrder = getStableQuestionOrder(
      loadedStateWithPendingUpdates.questionOrder,
      null,
      availableQuestions,
      sortedQuestions,
      meta.mosaicChildrenWithParent,
    )
    const nextState = { ...loadedStateWithPendingUpdates, questionOrder: nextOrder }
    simulationRef.current = nextState
    setSimulation(nextState)
    saveSurveyState(surveyId, nextState)
    hydratedRef.current = true
  }, [engine, meta, surveyId])

  const updateSimulation = useCallback(
    (updates: Partial<MipSimulationState>) => {
      const updatedState = { ...simulationRef.current, ...updates }
      engine.setSituation(updatedState.situation)
      const questions = getFormQuestions(engine, meta, updatedState.foldedSteps)
      const availableQuestions = [...new Set([...questions.relevantQuestions, ...questions.remainingQuestions])]
      const sortedQuestions = sortQuestions(engine, availableQuestions, meta, questions.missingVariables)
      const nextOrder = getStableQuestionOrder(
        simulationRef.current.questionOrder,
        currentQuestion,
        availableQuestions,
        sortedQuestions,
        meta.mosaicChildrenWithParent,
      )
      const nextState = { ...updatedState, questionOrder: nextOrder }
      simulationRef.current = nextState
      setSimulation(nextState)
      if (hydratedRef.current) {
        saveSurveyState(surveyId, nextState)
      } else {
        pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates }
      }
    },
    [currentQuestion, engine, meta, surveyId],
  )

  const resetSimulation = useCallback(() => {
    const nextState = emptySimulationState()
    simulationRef.current = nextState
    pendingUpdatesRef.current = {}
    engine.setSituation(nextState.situation)
    setSimulation(nextState)
    setCurrentQuestion(null)
    clearSurveyState(surveyId)
  }, [engine, surveyId])

  const contextValue = useMemo(
    () => ({
      surveyId,
      engine,
      meta,
      simulation,
      currentQuestion,
      setCurrentQuestion,
      updateSimulation,
      resetSimulation,
    }),
    [surveyId, engine, meta, simulation, currentQuestion, updateSimulation, resetSimulation],
  )

  return <MipPublicodesContext.Provider value={contextValue}>{children}</MipPublicodesContext.Provider>
}

export function useMipPublicodes() {
  const context = useContext(MipPublicodesContext)
  if (!context) {
    throw new Error('useMipPublicodes must be used within MipPublicodesProvider')
  }
  return context
}
