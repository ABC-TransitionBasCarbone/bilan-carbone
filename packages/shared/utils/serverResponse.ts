export type SuccessResponse<T> = {
  success: true
  data: T
}

export type ApiResponse<T = unknown> =
  | SuccessResponse<T>
  | {
      success: false
      errorMessage: string
    }

export type IsSuccess<T> = T extends SuccessResponse<infer U> ? U : never

type LogEntry = {
  userId: string
  functionName: string
  success: boolean
  errorMessage?: string
  start: Date
  duration: number
}

export const logServerFunctionCall = (entry: LogEntry) => {
  const logLine = `[${entry.start.toISOString()}] ${entry.success ? '✅' : '❌'} ${
    entry.functionName
  } - userId : ${entry.userId} in ${entry.duration}ms${entry.errorMessage ? ` – ${entry.errorMessage}` : ''}`
  console.log(logLine)
}
