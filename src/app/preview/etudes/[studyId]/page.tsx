import { getStudyById } from '@/db/study'
import { dbActualizedAuth } from '@/services/auth'
import { notFound, redirect } from 'next/navigation'
import PDFPreviewContent from './PDFPreviewContent'

interface Props {
  params: Promise<{ studyId: string }>
  searchParams: Promise<{ print?: string }>
}

export default async function PDFPreviewPage({ params, searchParams }: Props) {
  const { studyId } = await params
  const { print } = await searchParams

  // Vérifier que c'est bien pour l'impression (sécurité)
  if (!print) {
    redirect('/dashboard')
  }

  const session = await dbActualizedAuth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const study = await getStudyById(studyId, session.user.organizationVersionId)
  if (!study) {
    notFound()
  }

  return <PDFPreviewContent study={study} />
}
