export const displayOnlyExistingDataWithDash = (data: (string | null | undefined | number)[]) =>
  data.filter((d) => !!d).join(' - ')

export const toTitleCase = (str: string) => {
  const formatted = str.toLowerCase().replace(/_/g, ' ')
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export const toCamelCase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1)

/**
 * Convert to lower case and remove special characters and extra spaces
 */
export function normalizeStringForSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
