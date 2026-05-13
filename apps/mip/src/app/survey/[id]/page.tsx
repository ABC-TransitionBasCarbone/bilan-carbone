import SurveyClient from '@/components/survey/SurveyClient'
import { MipPublicodesProvider } from '@/publicodes/MipPublicodesProvider'

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <MipPublicodesProvider>
      <SurveyClient surveyId={id} />
    </MipPublicodesProvider>
  )
}
