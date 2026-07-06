'use client'
import type { RawRules } from '@/publicodes/mip-engine'
import dynamic from 'next/dynamic'

const Survey = dynamic(() => import('./Survey'), { ssr: false })

interface Props {
  surveyId: string
  model: RawRules
}

const SurveyClient = ({ surveyId, model }: Props) => <Survey surveyId={surveyId} model={model} />

export default SurveyClient
