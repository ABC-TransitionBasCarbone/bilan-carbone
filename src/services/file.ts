import { fileTypeFromBlob } from 'file-type'

export const allowedFlowFileTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

export const download = (fileContent: string[], fileName: string, fileType: string) => {
  const blob = new Blob(fileContent, { type: fileType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
}

export const downloadFromUrl = async (url: string, fileName: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    return response.statusText
  }

  const fileBlob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(fileBlob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}

export const isAllowedFileType = async (file: File, allowedTypes: string[]) => {
  const fileType = (await fileTypeFromBlob(file))?.mime
  return fileType && allowedTypes.includes(fileType)
}
