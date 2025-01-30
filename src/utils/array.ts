export const uniqBy = <T, K extends keyof T>(arr: T[], key: K) => {
  const filteredKeys = new Set<T[K]>()
  return arr.filter((item) => {
    if (filteredKeys.has(item[key])) {
      return false
    }
    filteredKeys.add(item[key])
    return true
  })
}
