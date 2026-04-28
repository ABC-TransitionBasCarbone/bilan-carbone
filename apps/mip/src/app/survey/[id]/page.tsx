import { Survey } from '@/components/survey/Survey'
import { sampleSurvey } from '@/data/sampleSurvey'

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <Survey survey={sampleSurvey} responseId={id} />
}
