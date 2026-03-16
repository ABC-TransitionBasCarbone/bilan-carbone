import withPdfAuth, { PdfAuthProps } from '@/components/hoc/withPdfAuth'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import PDFSummaryContainer from './PDFSummaryContainer'

const PDFPreviewPage = async ({ study, environment, locale }: PdfAuthProps) => {
  return (
    <DynamicTheme environment={environment}>
      <PDFSummaryContainer study={study} environment={environment} locale={locale} />
    </DynamicTheme>
  )
}

export default withPdfAuth(PDFPreviewPage)
