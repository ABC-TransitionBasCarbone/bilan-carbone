export type DownloadFileType = 'xlsx' | 'csv' | 'docx'

const downloadMimeTypes: Record<DownloadFileType, string> = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv;charset=utf-8;',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

const createAndClickDownloadLink = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
}

export const downloadFile = (
    fileContent: string[] | ArrayBuffer[],
    fileName: string,
    fileType: DownloadFileType,
): void => {
    const blob = new Blob(fileContent, { type: downloadMimeTypes[fileType] })
    createAndClickDownloadLink(blob, fileName)
}

export const downloadCsvFile = (fileName: string, csvContent: string): void => {
    const normalizedFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
    const blob = new Blob(['\ufeff', csvContent], { type: downloadMimeTypes.csv })
    createAndClickDownloadLink(blob, normalizedFileName)
}
