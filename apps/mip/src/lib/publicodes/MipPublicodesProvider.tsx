'use client'

import { ReactNode } from 'react'
import { RawRules } from './mip-engine'
import { MipSurveyProvider, useMipSurvey } from './MipSurveyProvider'
import { SimulationProvider, useSimulation } from './SimulationProvider'

export function MipPublicodesProvider({
  children,
  model,
  surveyId,
}: {
  children: ReactNode
  model: RawRules
  surveyId: string
}) {
  return (
    <SimulationProvider model={model}>
      <MipSurveyProvider surveyId={surveyId}>{children}</MipSurveyProvider>
    </SimulationProvider>
  )
}

export function useMipPublicodes() {
  return { ...useSimulation(), ...useMipSurvey() }
}
