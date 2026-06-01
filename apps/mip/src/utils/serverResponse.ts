import { auth } from '@/services/auth'
import type { ApiResponse } from '@abc-transitionbascarbone/utils/serverResponse'
import { logServerFunctionCall } from '@abc-transitionbascarbone/utils/serverResponse'


export const withServerResponse = async <T>(functionName: string, fn: () => Promise<T>): Promise<ApiResponse<T>> => {
  const session = await auth()
  const userId = session?.user.id ?? 'anonymous'
  const start = new Date()
  try {
    const data = await fn()
    const duration = Date.now() - start.getTime()
    await logServerFunctionCall({ userId, functionName, success: true, start, duration })
    return { success: true, data }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('error')
    const duration = Date.now() - start.getTime()

    logServerFunctionCall({
      userId,
      functionName,
      success: false,
      errorMessage: error.message,
      start,
      duration: duration,
    })

    return { success: false, errorMessage: error.message }
  }
}
