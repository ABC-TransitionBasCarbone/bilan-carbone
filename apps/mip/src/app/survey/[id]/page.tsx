import { Survey } from '@/components/survey/Survey'
import { sampleSurvey } from '@/data/sampleSurvey'
import { MipPublicodesProvider } from '@/publicodes/MipPublicodesProvider'

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <MipPublicodesProvider>
      <Survey survey={sampleSurvey} surveyId={id} />
    </MipPublicodesProvider>
  )
}
