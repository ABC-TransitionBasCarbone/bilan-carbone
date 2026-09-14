import { checkCronRequest } from '@/app/api/cron/utils'
import { getTrainingSessionsFromFTP } from '@/scripts/ftp/importTrainingSessions'
import { NextResponse, type NextRequest } from 'next/server'
import { POST } from './route'

jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    readonly status: number
    private readonly body: string
    constructor(body: string | null, init?: ResponseInit) {
      this.body = body ?? ''
      this.status = init?.status ?? 200
    }
    static json(body: unknown, init?: ResponseInit): MockNextResponse {
      return new MockNextResponse(JSON.stringify(body), init)
    }
    async text(): Promise<string> {
      return this.body
    }
  },
}))

jest.mock('@/app/api/cron/utils', () => ({
  checkCronRequest: jest.fn(),
}))

jest.mock('@/scripts/ftp/importTrainingSessions', () => ({
  getTrainingSessionsFromFTP: jest.fn(),
}))

describe('POST /api/cron/import-training-sessions', () => {
  const req = {} as NextRequest
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('returns cron auth/rate-limit error when request is rejected by middleware', async () => {
    const errorResponse = new NextResponse(null, { status: 401 })
    jest.mocked(checkCronRequest).mockReturnValue(errorResponse)

    const response = await POST(req)

    expect(response).toBe(errorResponse)
    expect(getTrainingSessionsFromFTP).not.toHaveBeenCalled()
  })

  it('returns 200 when import succeeds', async () => {
    jest.mocked(checkCronRequest).mockReturnValue(null)
    const firstRows = [{ name: 'Sessions', data: [['row 1'], ['row 2'], ['row 3']] }]
    jest.mocked(getTrainingSessionsFromFTP).mockResolvedValue(firstRows)

    const response = await POST(req)

    expect(getTrainingSessionsFromFTP).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe(JSON.stringify(firstRows))
  })

  it('returns 500 when import fails', async () => {
    const error = new Error('FTP down')
    jest.mocked(checkCronRequest).mockReturnValue(null)
    jest.mocked(getTrainingSessionsFromFTP).mockRejectedValue(error)

    const response = await POST(req)

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toBe('Import training sessions failed')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in import-training-sessions cron:', error)
  })
})
