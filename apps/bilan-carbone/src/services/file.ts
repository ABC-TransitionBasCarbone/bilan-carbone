import { downloadFile, DownloadFileType } from '@abc-transitionbascarbone/utils/download'
import { fileTypeFromBlob } from 'file-type'

const KB = 1024
export const MB = 1024 * KB

export const allowedFlowFileTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

export const maxAllowedFileSize = 5 * MB

export const download = (fileContent: string[] | ArrayBuffer[], fileName: string, fileType: DownloadFileType) => {
  downloadFile(fileContent, fileName, fileType)
}

export const downloadFromUrl = (url: string, fileName: string) => {
  const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&fileName=${encodeURIComponent(fileName)}`
  const a = document.createElement('a')
  a.href = proxyUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export const isAllowedFileType = async (file: File, allowedTypes: string[]) => {
  const fileType = (await fileTypeFromBlob(file))?.mime
  return fileType && allowedTypes.includes(fileType)
}
