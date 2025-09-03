import withPdfAuth, { PdfAuthProps } from '@/components/hoc/withPdfAuth'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import PDFSummary from './PDFSummary'

const PDFPreviewPage = async ({ study, environment }: PdfAuthProps) => {
  return (
    <DynamicTheme environment={environment}>
      <PDFSummary study={study} environment={environment} />
    </DynamicTheme>
  )
}

export default withPdfAuth(PDFPreviewPage)
