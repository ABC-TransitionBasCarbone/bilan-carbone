import { checkCronRequest } from '@/app/api/cron/utils'
import { deactivateExpiredCourseUsers } from '@/services/training'
import { NextRequest, NextResponse } from 'next/server'
import { POST } from './route'

jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    readonly status: number
    constructor(
      readonly body: string | null,
      init?: ResponseInit,
    ) {
      this.status = init?.status ?? 200
    }
    static json(body: unknown, init?: ResponseInit) {
      return new MockNextResponse(JSON.stringify(body), init)
    }
    async text() {
      return this.body
    }
  },
}))
jest.mock('@/app/api/cron/utils', () => ({ checkCronRequest: jest.fn() }))
jest.mock('@/services/training', () => ({ deactivateExpiredCourseUsers: jest.fn() }))

describe('POST /api/cron/deactivate-course-users', () => {
  const req = {} as NextRequest
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects an unauthorized cron without changing accounts', async () => {
    const error = new NextResponse('Unauthorized', { status: 401 })
    jest.mocked(checkCronRequest).mockReturnValue(error)
    expect(await POST(req)).toBe(error)
    expect(deactivateExpiredCourseUsers).not.toHaveBeenCalled()
  })

  it('returns the number of deactivated trainees', async () => {
    jest.mocked(checkCronRequest).mockReturnValue(null)
    jest.mocked(deactivateExpiredCourseUsers).mockResolvedValue({ deactivated: 2 })
    const response = await POST(req)
    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe('{"deactivated":2}')
  })

  it('reports and logs failures', async () => {
    const error = new Error('invalid configuration')
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      jest.mocked(checkCronRequest).mockReturnValue(null)
      jest.mocked(deactivateExpiredCourseUsers).mockRejectedValue(error)
      const response = await POST(req)
      expect(response.status).toBe(500)
      expect(log).toHaveBeenCalledWith('Error in deactivate-course-users cron:', error)
    } finally {
      log.mockRestore()
    }
  })
})
