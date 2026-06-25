import type { JsonValue } from '@abc-transitionbascarbone/db-common/types'

export const handleCopy = async (link: string): Promise<void> => {
  await navigator.clipboard.writeText(link)
}

export const handleDownloadJson = (name: string, json?: JsonValue) => {
  if (!json) {
    return
  }
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.json`
  a.click()

  URL.revokeObjectURL(url)
}
