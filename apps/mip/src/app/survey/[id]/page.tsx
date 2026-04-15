'use client'

import React from 'react'
import { SurveyPage } from '@/components/survey/SurveyPage'
import { sampleSurvey } from '@/data/sampleSurvey'

export default function SurveyRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  
  return <SurveyPage survey={sampleSurvey} responseId={id} />
}
