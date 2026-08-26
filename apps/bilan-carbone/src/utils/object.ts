// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const objectWithoutNullAttributes = (object?: Record<string, any>) => {
  if (!object) {
    return {}
  }
  Object.keys(object).forEach((attr) => {
    if (object[attr] === null) {
      delete object[attr]
    }
  })
  return object
}

export const typedEntries = <K extends string, V>(obj: Partial<Record<K, V>>): Array<[K, V]> => {
  return Object.entries(obj) as Array<[K, V]>
}
