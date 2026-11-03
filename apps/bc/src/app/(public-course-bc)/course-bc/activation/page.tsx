import CourseActivationForm from '@/components/auth/CourseActivationForm'
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'

const ActivationPage = async () => {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return <CourseActivationForm />
}

export default ActivationPage
