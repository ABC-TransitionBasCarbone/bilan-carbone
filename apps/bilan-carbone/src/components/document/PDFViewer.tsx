import styles from './PDFViewer.module.css'

interface Props {
  pdfUrl?: string
  fileName?: string
}

const PdfViewer = ({ pdfUrl, fileName }: Props) => {
  return pdfUrl && <iframe src={pdfUrl} className={styles.pdf} title={fileName} />
}

export default PdfViewer
