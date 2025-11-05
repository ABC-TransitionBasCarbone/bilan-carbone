import { useEffect } from 'react'

export const useLocalStorageSync = (
  key: string,
  value: string | number | boolean | object | string[],
  enabled: boolean,
) => {
  useEffect(() => {
    if (enabled) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, [key, value, enabled])
}
