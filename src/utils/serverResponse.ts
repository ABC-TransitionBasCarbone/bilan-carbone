import { auth } from '@/services/auth'

export type SuccessResponse<T> = {
  success: true
  data: T
}

export type IsSuccess<T> = T extends SuccessResponse<infer U> ? U : never

export type ApiResponse<T = unknown> =
  | SuccessResponse<T>
  | {
      success: false
      errorMessage: string
    }

export const withServerResponse = async <T>(functionName: string, fn: () => Promise<T>): Promise<ApiResponse<T>> => {
  const session = await auth()
  const userId = session?.user.id ?? 'anonymous'
  const start = new Date()
  try {
    const data = await fn()
    const duration = Date.now() - start.getTime()
    logServerFunctionCall({ userId, functionName, success: true, start, duration })
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

type LogEntry = {
  userId: string
  functionName: string
  success: boolean
  errorMessage?: string
  start: Date
  duration: number
}

const logServerFunctionCall = (entry: LogEntry) => {
  const logLine = `[${entry.start.toISOString()}] ${entry.success ? '✅' : '❌'} ${
    entry.functionName
  } - userId : ${entry.userId} in ${entry.duration}ms${entry.errorMessage ? ` – ${entry.errorMessage}` : ''}`
  console.log(logLine)
}
