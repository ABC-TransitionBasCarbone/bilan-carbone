import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockedFullStudy, getMockedFullStudySite } from '@/tests/utils/models/study'
import { getMockedDbAccount } from '@/tests/utils/models/user'
import { AccountWithUser } from '@/types/account.types'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import { Environment, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import * as studyUtilsModule from '../../utils/study'
import { canUpdateEmissionSource, hasStudyBasicRights } from './emissionSource'
import * as studyModule from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))

jest.mock('./study', () => ({ canReadStudy: jest.fn() }))
jest.mock('../../utils/study', () => ({ getAccountRoleOnStudy: jest.fn() }))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

const mockCanReadStudy = studyModule.canReadStudy as jest.Mock
const mockGetAccountRoleOnStudy = studyUtilsModule.getAccountRoleOnStudy as jest.Mock

describe('hasStudyBasicRights', () => {
  it('blocks an expired course contributor from updating existing data', async () => {
    const account = getMockedDbAccount({ environment: Environment.COURSE_BC }) as AccountWithUser
    account.courseAccess = { isProfessor: false, periods: [{ startDate: '2000-01-01', expiresAt: '2000-02-01' }] }
    const study = getMockedFullStudy()
    const source = {
      ...getMockedFullStudyEmissionSource(),
      studyId: study.id,
      studySiteId: 'site',
      recycledPart: null,
      lastEditorId: null,
    }
    await expect(canUpdateEmissionSource(account, source, { value: 123 }, study)).resolves.toBe(false)
  })
  it('should return false if user cannot read study', async () => {
    const account = getMockedDbAccount() as AccountWithUser
    const site = getMockedFullStudySite({ id: 'study-site-1' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(false)

    const result = await hasStudyBasicRights(account, study)

    expect(result).toBe(false)
    expect(mockCanReadStudy).toHaveBeenCalledWith(accountWithUserToUserSession(account), study.id)
    expect(mockGetAccountRoleOnStudy).not.toHaveBeenCalled()
  })

  it('should return true if user has a role on study and is not a reader', async () => {
    const account = getMockedDbAccount() as AccountWithUser
    const site = getMockedFullStudySite({ id: 'study-site-1' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(true)
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Editor)

    const result = await hasStudyBasicRights(account, study)

    expect(result).toBe(true)
    expect(mockCanReadStudy).toHaveBeenCalledWith(accountWithUserToUserSession(account), study.id)
    expect(mockGetAccountRoleOnStudy).toHaveBeenCalledWith(accountWithUserToUserSession(account), study)
  })

  it('should return false if user has a role on study and is a reader', async () => {
    const account = getMockedDbAccount() as AccountWithUser
    const site = getMockedFullStudySite({ id: 'site-1' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(true)
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Reader)

    const result = await hasStudyBasicRights(account, study)

    expect(result).toBe(false)
    expect(mockCanReadStudy).toHaveBeenCalledWith(accountWithUserToUserSession(account), study.id)
    expect(mockGetAccountRoleOnStudy).toHaveBeenCalledWith(accountWithUserToUserSession(account), study)
  })

  it('should return false if user has no role on study', async () => {
    const account = getMockedDbAccount() as AccountWithUser
    const site = getMockedFullStudySite({ id: 'site-1' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(true)
    mockGetAccountRoleOnStudy.mockReturnValue(null)

    const result = await hasStudyBasicRights(account, study)

    expect(result).toBe(false)
    expect(mockCanReadStudy).toHaveBeenCalledWith(accountWithUserToUserSession(account), study.id)
    expect(mockGetAccountRoleOnStudy).toHaveBeenCalledWith(accountWithUserToUserSession(account), study)
  })
})
