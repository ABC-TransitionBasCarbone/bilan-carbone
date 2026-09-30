import { expect } from '@jest/globals'
import * as accountModule from '../../db/account'
import * as emissionSourceModule from '../../db/emissionSource'
import * as studySourceModule from '../../db/study'
import * as authModule from '../auth'

// TODO: ESM module issue with Jest. Remove these mocks when moving to Vitest
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

jest.mock('../../db/account', () => ({
  getAccountById: jest.fn(),
}))

jest.mock('../../db/emissionSource', () => ({
  updateStudyTag: jest.fn(),
  getTagById: jest.fn(),
  getTagFamilyById: jest.fn(),
}))

jest.mock('../../db/study', () => ({
  getStudyById: jest.fn(),
}))

jest.mock('@abc-transitionbascarbone/application/services/permissions/check', () => ({
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

const { updateTag } = jest.requireActual('./emissionSource')

const mockAuth = authModule.auth as jest.Mock
const mockGetAccountById = accountModule.getAccountById as jest.Mock
const mockUpdateStudyTag = emissionSourceModule.updateStudyTag as jest.Mock
const mockGetTagById = emissionSourceModule.getTagById as jest.Mock
const mockGetTagFamilyById = emissionSourceModule.getTagFamilyById as jest.Mock
const mockGetStudyById = studySourceModule.getStudyById as jest.Mock

const mockSession = {
  user: {
    accountId: 'account-id',
    environment: 'BC',
    role: 'ADMIN',
    organizationVersionId: 'org-version-id',
    level: 'Advanced',
  },
}

const mockAccount = {
  id: 'account-id',
  environment: 'BC',
  role: 'ADMIN',
  organizationVersionId: 'org-version-id',
}

describe('updateTag', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue(mockSession)
    mockGetAccountById.mockResolvedValue(mockAccount)
    mockUpdateStudyTag.mockResolvedValue({ id: 'tag-id' })
    mockGetTagById.mockResolvedValue({ id: 'tag-id', familyId: 'family-id' })
    mockGetTagFamilyById.mockResolvedValue({ studyId: 'study-id' })
    mockGetStudyById.mockResolvedValue({
      id: 'study-id',
      allowedUsers: [],
      level: 'Initial',
      organizationVersion: { environment: 'BC', id: 'org-version-id', activatedLicence: [new Date().getFullYear()] },
    })
  })

  describe('Authentication and Authorization', () => {
    it('should return error when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null)

      const result = await updateTag('tag-id', 'New Name', '#ff0000', 'family-id')

      expect(result).toEqual({
        success: false,
        errorMessage: 'Not authorized',
      })
      expect(mockUpdateStudyTag).not.toHaveBeenCalled()
    })

    it('should return error when session has no user', async () => {
      mockAuth.mockResolvedValue({ user: null })

      const result = await updateTag('tag-id', 'New Name', '#ff0000', 'family-id')

      expect(result).toEqual({
        success: false,
        errorMessage: 'Not authorized',
      })
      expect(mockUpdateStudyTag).not.toHaveBeenCalled()
    })

    it('should return error when account is not found', async () => {
      mockGetAccountById.mockResolvedValue(null)

      const result = await updateTag('tag-id', 'New Name', '#ff0000', 'family-id')

      expect(result).toEqual({
        success: false,
        errorMessage: 'Not authorized',
      })
      expect(mockUpdateStudyTag).not.toHaveBeenCalled()
    })

    it('should return error when user has no access to create emission source tag', async () => {
      mockAuth.mockReturnValue({
        user: {
          accountId: 'account-id',
          environment: 'CUT',
        },
      })
      mockGetAccountById.mockResolvedValue({
        id: 'account-id',
        environment: 'CUT',
        organizationVersionId: 'org-version-id',
      })

      const result = await updateTag('tag-id', 'New Name', '#ff0000', 'family-id')

      expect(result).toEqual({
        success: false,
        errorMessage: 'Not authorized',
      })
      expect(mockUpdateStudyTag).not.toHaveBeenCalled()
    })
  })

  describe('Successful Updates', () => {
    it('should update tag with name, color, and family', async () => {
      const result = await updateTag('tag-id', 'New Name', '#ff0000', 'family-id')

      expect(result).toEqual({
        success: true,
        data: { id: 'tag-id' },
      })
      expect(mockUpdateStudyTag).toHaveBeenCalledWith('tag-id', {
        name: 'New Name',
        color: '#ff0000',
        family: { connect: { id: 'family-id' } },
      })
    })
  })
})
