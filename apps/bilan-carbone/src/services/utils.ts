export const sortAlphabetically = (a: string | undefined | null, b: string | undefined | null) =>
  a?.localeCompare(b ?? '') ?? 0
