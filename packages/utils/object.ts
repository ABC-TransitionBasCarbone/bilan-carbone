export const isObject = <T extends Record<string, unknown>>(value: unknown): value is T => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeObjects = <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T => {
  for (const source of sources) {
    if (!isObject(source)) {
      continue
    }
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key] || !isObject(target[key])) {
          target[key] = {} as T[Extract<keyof T, string>]
        }
        mergeObjects(target[key] as T[Extract<keyof T, string>], source[key] as Partial<T[Extract<keyof T, string>]>)
      } else {
        if (source[key] !== undefined) {
          target[key] = source[key]
        }
      }
    }
  }
  return target
}
