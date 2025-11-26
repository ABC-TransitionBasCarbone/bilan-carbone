export const uniqueByKey = <T, K extends keyof T>(arr: T[], key: K) => {
  const filteredKeys = new Set<T[K]>()
  return arr.filter((item) => {
    if (filteredKeys.has(item[key])) {
      return false
    }
    filteredKeys.add(item[key])
    return true
  })
}

export const unique = <T>(arr: T[]): T[] => [...new Set(arr)]

export const getNestedValue = <T extends object, R = unknown>(obj: T, path: string): R | undefined => {
  const [key, ...rest] = path.split('.')
  const value = (obj as Record<string, unknown>)[key]
  if (rest.length === 0) {
    return value as R
  }
  if (value !== null && typeof value === 'object') {
    return getNestedValue(value as object, rest.join('.'))
  }
  return undefined
}

export const groupBy = <T, K extends keyof T>(array: T[], attribute: K): Record<string, T[]> =>
  array.reduce<Record<string, T[]>>((arr, el) => {
    const value = String(el[attribute])
    if (!arr[value]) {
      arr[value] = []
    }
    arr[value].push(el)
    return arr
  }, {})
