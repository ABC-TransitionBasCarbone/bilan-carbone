export const displayOnlyExistingDataWithDash = (data: (string | null | undefined | number)[]) =>
  data.filter((d) => !!d).join(' - ')

export const toTitleCase = (str: string) => {
  const formatted = str.toLowerCase().replace(/_/g, ' ')
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}
