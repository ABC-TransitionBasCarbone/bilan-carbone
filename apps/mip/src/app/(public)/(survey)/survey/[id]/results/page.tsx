import { redirect } from 'next/navigation'

const LegacySurveyResultsRedirect = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  redirect(`/dashboard/${id}`)
}

export default LegacySurveyResultsRedirect
