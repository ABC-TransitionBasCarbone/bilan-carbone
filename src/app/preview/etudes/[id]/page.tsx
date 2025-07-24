import withAuth from '@/components/hoc/withAuth'
import withStudy, { StudyProps } from '@/components/hoc/withStudy'
import PDFSummary from './PDFSummary'

const PDFPreviewPage = async ({ study }: StudyProps) => {
  return <PDFSummary study={study} />
}

export default withAuth(withStudy(PDFPreviewPage))
