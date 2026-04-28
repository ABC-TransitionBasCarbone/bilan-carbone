import { checkCronRequest } from '@/app/api/cron/utils'
import { getUsersFromFTP } from '@/scripts/ftp/importUsers'
import { type NextRequest } from 'next/server'
import { POST } from './route'

jest.mock('@/app/api/cron/utils', () => ({
  checkCronRequest: jest.fn(),
}))

jest.mock('@/scripts/ftp/importUsers', () => ({
  getUsersFromFTP: jest.fn(),
}))

describe('POST /api/cron/import-users', () => {
  const req = {} as NextRequest
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
  })

  it('returns cron auth/rate-limit error when request is rejected by middleware', async () => {
    const errorResponse = { status: 401 } as Response
    jest.mocked(checkCronRequest).mockReturnValue(errorResponse)

    const response = await POST(req)

    expect(response).toBe(errorResponse)
    expect(getUsersFromFTP).not.toHaveBeenCalled()
  })

  it('returns 200 when import succeeds', async () => {
    jest.mocked(checkCronRequest).mockReturnValue(null)
    jest.mocked(getUsersFromFTP).mockResolvedValue(undefined)

    const response = await POST(req)

    expect(getUsersFromFTP).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
  })

  it('returns 500 when import fails', async () => {
    const error = new Error('FTP down')
    jest.mocked(checkCronRequest).mockReturnValue(null)
    jest.mocked(getUsersFromFTP).mockRejectedValue(error)

    const response = await POST(req)

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toBe('Import users failed')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error in import-users cron:', error)
  })
})
