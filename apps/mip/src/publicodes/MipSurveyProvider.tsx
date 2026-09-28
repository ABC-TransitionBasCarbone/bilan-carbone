'use client'

import { clearSurveyState, loadSurveyState, saveSurveyState } from '@/components/survey/surveyStateStorage'
import { parseMipSimulationState, type MipSimulationState } from '@/utils/survey'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getFormQuestions, getStableQuestionOrder, sortQuestions } from './mip-rules'
import { useSimulation } from './SimulationProvider'

export const emptySimulationState = (): MipSimulationState => ({
  situation: {},
  foldedSteps: [],
  actionChoices: {},
  progression: 0,
  questionOrder: [],
})

type MipSurveyContextValue = {
  surveyId: string
  simulation: MipSimulationState
  currentQuestion: string | null
  setCurrentQuestion: (question: string | null) => void
  updateSimulation: (updates: Partial<MipSimulationState>) => void
  resetSimulation: () => void
}

const MipSurveyContext = createContext<MipSurveyContextValue | null>(null)

export function MipSurveyProvider({ children, surveyId }: { children: ReactNode; surveyId: string }) {
  const { engine, meta, setSituation } = useSimulation()
  const [simulation, setSimulation] = useState<MipSimulationState>(emptySimulationState)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const simulationRef = useRef(simulation)
  const hydratedRef = useRef(false)
  const pendingUpdatesRef = useRef<Partial<MipSimulationState>>({})

  useEffect(() => {
    const storedState = loadSurveyState<unknown>(surveyId)
    const loadedState = storedState ? parseMipSimulationState(storedState) : emptySimulationState()
    const loadedStateWithPendingUpdates = { ...loadedState, ...pendingUpdatesRef.current }
    setSituation(loadedStateWithPendingUpdates.situation)
    const questions = getFormQuestions(engine, meta, loadedStateWithPendingUpdates.foldedSteps)
    const availableQuestions = [...new Set([...questions.relevantQuestions, ...questions.remainingQuestions])]
    const sortedQuestions = sortQuestions(engine, availableQuestions, meta, questions.missingVariables)
    const questionOrder = getStableQuestionOrder(
      loadedStateWithPendingUpdates.questionOrder,
      null,
      availableQuestions,
      sortedQuestions,
      meta.mosaicChildrenWithParent,
    )
    const nextState = { ...loadedStateWithPendingUpdates, questionOrder }
    simulationRef.current = nextState
    setSimulation(nextState)
    saveSurveyState(surveyId, nextState)
    hydratedRef.current = true
  }, [engine, meta, setSituation, surveyId])

  const updateSimulation = useCallback(
    (updates: Partial<MipSimulationState>) => {
      const updatedState = { ...simulationRef.current, ...updates }
      setSituation(updatedState.situation)
      const questions = getFormQuestions(engine, meta, updatedState.foldedSteps)
      const availableQuestions = [...new Set([...questions.relevantQuestions, ...questions.remainingQuestions])]
      const sortedQuestions = sortQuestions(engine, availableQuestions, meta, questions.missingVariables)
      const questionOrder = getStableQuestionOrder(
        simulationRef.current.questionOrder,
        currentQuestion,
        availableQuestions,
        sortedQuestions,
        meta.mosaicChildrenWithParent,
      )
      const nextState = { ...updatedState, questionOrder }
      simulationRef.current = nextState
      setSimulation(nextState)
      if (hydratedRef.current) {
        saveSurveyState(surveyId, nextState)
      } else {
        pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates }
      }
    },
    [currentQuestion, engine, meta, setSituation, surveyId],
  )

  const resetSimulation = useCallback(() => {
    const nextState = emptySimulationState()
    simulationRef.current = nextState
    pendingUpdatesRef.current = {}
    setSituation(nextState.situation)
    setSimulation(nextState)
    setCurrentQuestion(null)
    clearSurveyState(surveyId)
  }, [setSituation, surveyId])

  const value = useMemo(
    () => ({
      surveyId,
      simulation,
      currentQuestion,
      setCurrentQuestion,
      updateSimulation,
      resetSimulation,
    }),
    [surveyId, simulation, currentQuestion, updateSimulation, resetSimulation],
  )

  return <MipSurveyContext.Provider value={value}>{children}</MipSurveyContext.Provider>
}

export const useMipSurvey = () => {
  const context = useContext(MipSurveyContext)
  if (!context) {
    throw new Error('useMipSurvey must be used within MipSurveyProvider')
  }
  return context
}
