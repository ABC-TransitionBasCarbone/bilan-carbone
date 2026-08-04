'use client'
import dynamic from 'next/dynamic'

const Survey = dynamic(() => import('./Survey'), { ssr: false })

interface Props {
  surveyId: string
}

const SurveyClient = ({ surveyId }: Props) => <Survey surveyId={surveyId} />

export default SurveyClient
