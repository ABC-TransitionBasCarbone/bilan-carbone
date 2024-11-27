export const download = (fileContent: string, filename: string, filetype: string) => {
  const blob = new Blob([fileContent], { type: filetype })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
}
