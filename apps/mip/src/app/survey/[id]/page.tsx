import Survey from '@/components/survey/Survey'
import { MipPublicodesProvider } from '@/publicodes/MipPublicodesProvider'

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <MipPublicodesProvider>
      <Survey surveyId={id} />
    </MipPublicodesProvider>
  )
}
