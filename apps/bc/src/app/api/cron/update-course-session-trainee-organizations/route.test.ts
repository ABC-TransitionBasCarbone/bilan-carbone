import { checkCronRequest } from '@/app/api/cron/utils'
import { updateCourseSessionTraineeOrganizationStatuses } from '@/services/courseSessionTraineeOrganization'
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

jest.mock('@/services/courseSessionTraineeOrganization', () => ({
  updateCourseSessionTraineeOrganizationStatuses: jest.fn(),
}))

describe('POST /api/cron/update-course-session-trainee-organizations', () => {
  const req = {} as NextRequest
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('returns cron auth/rate-limit error when request is rejected', async () => {
    const errorResponse = new NextResponse(null, { status: 401 })
    jest.mocked(checkCronRequest).mockReturnValue(errorResponse)

    const response = await POST(req)

    expect(response).toBe(errorResponse)
    expect(updateCourseSessionTraineeOrganizationStatuses).not.toHaveBeenCalled()
  })

  it('returns update counts when synchronization succeeds', async () => {
    jest.mocked(checkCronRequest).mockReturnValue(null)
    jest.mocked(updateCourseSessionTraineeOrganizationStatuses).mockResolvedValue({
      activated: 3,
      deactivated: 1,
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe(JSON.stringify({ activated: 3, deactivated: 1 }))
  })

  it('returns 500 and logs when synchronization fails', async () => {
    const error = new Error('Database unavailable')
    jest.mocked(checkCronRequest).mockReturnValue(null)
    jest.mocked(updateCourseSessionTraineeOrganizationStatuses).mockRejectedValue(error)

    const response = await POST(req)

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toBe('Updating course session trainee organizations failed')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in update-course-session-trainee-organizations cron:', error)
  })
})
