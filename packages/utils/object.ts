export const isObject = <T extends Record<string, unknown>>(value: unknown): value is T => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const FORBIDDEN_MERGE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeObjects = <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T => {
  const mutableTarget = target as Record<string, unknown>

  for (const source of sources) {
    if (!isObject(source)) {
      continue
    }
    for (const [key, value] of Object.entries(source)) {
      if (FORBIDDEN_MERGE_KEYS.has(key)) {
        continue
      }

      if (isObject(value)) {
        if (!isObject(mutableTarget[key])) {
          mutableTarget[key] = {}
        }
        mergeObjects(mutableTarget[key] as Record<string, any>, value as Record<string, any>)
      } else {
        if (value !== undefined) {
          mutableTarget[key] = value
        }
      }
    }
  }
  return target
}
