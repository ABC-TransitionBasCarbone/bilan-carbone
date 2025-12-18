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

export function sortByCustomOrder<T>(items: T[], customOrder: string[], getKey: (item: T) => string | undefined): T[] {
  if (!customOrder.length) {
    return items
  }

  const orderMap = new Map(customOrder.map((key, index) => [key.toLowerCase(), index]))

  return [...items].sort((a, b) => {
    const aKey = getKey(a)?.toLowerCase()
    const bKey = getKey(b)?.toLowerCase()

    const aIndex = aKey ? orderMap.get(aKey) : undefined
    const bIndex = bKey ? orderMap.get(bKey) : undefined

    if (aIndex === undefined && bIndex === undefined) {
      return 0
    }

    if (aIndex === undefined) {
      return 1
    }

    if (bIndex === undefined) {
      return -1
    }

    return aIndex - bIndex
  })
}
