// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeObjects<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) {
    return target
  }

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
