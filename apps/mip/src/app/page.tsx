import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  // Generate a new UUID and redirect to the survey page (surveyId)
  const surveyId = uuidv4()
  redirect(`/survey/${surveyId}`)
}
