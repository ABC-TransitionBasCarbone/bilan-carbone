import { downloadFile, DownloadFileType } from '@abc-transitionbascarbone/common/utils/download'

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
