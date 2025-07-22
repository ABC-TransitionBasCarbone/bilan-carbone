import withAuth from '@/components/hoc/withAuth'
import { getStudyById } from '@/db/study'
import { dbActualizedAuth } from '@/services/auth'
import { notFound, redirect } from 'next/navigation'
import PDFSummary from './PDFSummary'

interface Props {
  params: Promise<{ studyId: string }>
}

const PDFPreviewPage = async ({ params }: Props) => {
  const { studyId } = await params

  const session = await dbActualizedAuth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const study = await getStudyById(studyId, session.user.organizationVersionId)
  if (!study) {
    notFound()
  }

  return <PDFSummary study={study} />
}

export default withAuth(PDFPreviewPage)
