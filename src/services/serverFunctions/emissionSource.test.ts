import { expect } from '@jest/globals'
import * as accountModule from '../../db/account'
import * as emissionSourceModule from '../../db/emissionSource'
import * as authModule from '../auth'
import * as environmentPermissionModule from '../permissions/environment'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

jest.mock('../../db/account', () => ({
  getAccountById: jest.fn(),
}))

jest.mock('../../db/emissionSource', () => ({
  updateEmissionSourceTagOnStudy: jest.fn(),
}))

jest.mock('../permissions/environment', () => ({
  hasAccessToCreateEmissionSourceTag: jest.fn(),
}))

jest.mock('../permissions/check', () => ({
  NOT_AUTHORIZED: 'Not authorized',
}))

jest.mock('../../utils/serverResponse', () => ({
  withServerResponse: jest.fn(async (_name, fn) => {
    try {
      const data = await fn()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }),
}))

jest.mock('./emissionSource', () => ({}))

const { updateEmissionSourceTag } = jest.requireActual('./emissionSource')

const mockAuth = authModule.auth as jest.Mock
const mockGetAccountById = accountModule.getAccountById as jest.Mock
const mockUpdateEmissionSourceTagOnStudy = emissionSourceModule.updateEmissionSourceTagOnStudy as jest.Mock
const mockHasAccessToCreateEmissionSourceTag =
  environmentPermissionModule.hasAccessToCreateEmissionSourceTag as jest.Mock

const mockSession = {
  user: {
    accountId: 'account-id',
  },
}

const mockAccount = {
  id: 'account-id',
  environment: 'BC',
}

describe('updateEmissionSourceTag', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue(mockSession)
    mockGetAccountById.mockResolvedValue(mockAccount)
    mockHasAccessToCreateEmissionSourceTag.mockResolvedValue(true)
    mockUpdateEmissionSourceTagOnStudy.mockResolvedValue({ id: 'tag-id' })
  })

  describe('Authentication and Authorization', () => {
    it('should return error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const result = await updateEmissionSourceTag('tag-id', 'New Name', '#ff0000')

      expect(result).toEqual({
        success: false,
        errorMessage: 'Not authorized',
      })
      expect(mockUpdateEmissionSourceTagOnStudy).not.toHaveBeenCalled()
    })

    it('should return error when session has no user', async () => {
      mockAuth.mockResolvedValue({ user: null })

      const result = await updateEmissionSourceTag('tag-id', 'New Name', '#ff0000')

      expect(result).toEqual({
        success: false,
        errorMessage: 'Not authorized',
      })
      expect(mockUpdateEmissionSourceTagOnStudy).not.toHaveBeenCalled()
    })

    it('should return error when account is not found', async () => {
      mockGetAccountById.mockResolvedValue(null)

      const result = await updateEmissionSourceTag('tag-id', 'New Name', '#ff0000')

      expect(result).toEqual({
        success: false,
        errorMessage: 'Not authorized',
      })
      expect(mockUpdateEmissionSourceTagOnStudy).not.toHaveBeenCalled()
    })

    it('should return error when user has no access to create emission source tag', async () => {
      mockHasAccessToCreateEmissionSourceTag.mockResolvedValue(false)

      const result = await updateEmissionSourceTag('tag-id', 'New Name', '#ff0000')

      expect(result).toEqual({
        success: false,
        errorMessage: 'Not authorized',
      })
      expect(mockUpdateEmissionSourceTagOnStudy).not.toHaveBeenCalled()
    })
  })

  describe('Successful Updates', () => {
    it('should update tag with name, color, and family', async () => {
      const result = await updateEmissionSourceTag('tag-id', 'New Name', '#ff0000', 'family-id')

      expect(result).toEqual({
        success: true,
        data: { id: 'tag-id' },
      })
      expect(mockUpdateEmissionSourceTagOnStudy).toHaveBeenCalledWith('tag-id', {
        name: 'New Name',
        color: '#ff0000',
        family: { connect: { id: 'family-id' } },
      })
    })
  })
})
