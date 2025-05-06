export type ApiResponse<T = unknown> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      errorMessage: string
    }

export const withServerResponse = async <T>(fn: () => Promise<T>): Promise<ApiResponse<T>> => {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('error')
    return {
      success: false,
      errorMessage: error.message,
    }
  }
}
