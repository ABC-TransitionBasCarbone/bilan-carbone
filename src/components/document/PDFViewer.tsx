import { getDocument } from '@/services/serverFunctions/file'
import { useEffect, useState } from 'react'

interface Props {
  fileKey: string
}

const PdfViewer = ({ fileKey }: Props) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    const handleFetchPdf = async () => {
      try {
        const url = await getDocument(fileKey)
        setPdfUrl(url)
      } catch (error) {
        console.error('Erreur lors de la récupération du fichier :', error)
      }
    }
    handleFetchPdf()
  })

  return (
    <div>
      {pdfUrl && (
        <iframe src={pdfUrl} style={{ width: '100%', height: '500px', border: 'none' }} title="Aperçu du PDF" />
      )}
    </div>
  )
}

export default PdfViewer
