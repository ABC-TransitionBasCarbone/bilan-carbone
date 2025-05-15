import { getMockedEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockedFullStudy, getMockedFullStudySite } from '@/tests/utils/models/study'
import { getMockedDbUser } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { StudyRole } from '@prisma/client'
import * as studyUtilsModule from '../../utils/study'
import { hasStudyBasicRights } from './emissionSource'
import * as studyModule from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))

jest.mock('./study', () => ({ canReadStudy: jest.fn() }))
jest.mock('../../utils/study', () => ({ getUserRoleOnStudy: jest.fn() }))

const mockCanReadStudy = studyModule.canReadStudy as jest.Mock
const mockGetUserRoleOnStudy = studyUtilsModule.getUserRoleOnStudy as jest.Mock

describe('hasStudyBasicRights', () => {
  it('should return false if user cannot read study', async () => {
    const user = getMockedDbUser()
    const site = getMockedFullStudySite({ id: 'study-site-1' })
    const emissionSource = getMockedEmissionSource({ studySiteId: 'study-site-1' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(false)

    const result = await hasStudyBasicRights(user, emissionSource, study)

    expect(result).toBe(false)
    expect(mockCanReadStudy).toHaveBeenCalledWith(user, study.id)
    expect(mockGetUserRoleOnStudy).not.toHaveBeenCalled()
  })

  it('should return false if site is not in study', async () => {
    const user = getMockedDbUser()
    const site = getMockedFullStudySite({ id: 'site-1' })
    const emissionSource = getMockedEmissionSource({ studySiteId: 'not-in-study' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(true)

    const result = await hasStudyBasicRights(user, emissionSource, study)

    expect(result).toBe(false)
    expect(mockCanReadStudy).toHaveBeenCalledWith(user, study.id)
    expect(mockGetUserRoleOnStudy).not.toHaveBeenCalled()
  })

  it('should return true if user has a role on study and is not a reader', async () => {
    const user = getMockedDbUser()
    const site = getMockedFullStudySite({ id: 'study-site-1' })
    const emissionSource = getMockedEmissionSource({ studySiteId: 'study-site-1' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(true)
    mockGetUserRoleOnStudy.mockReturnValue(StudyRole.Editor)

    const result = await hasStudyBasicRights(user, emissionSource, study)

    expect(result).toBe(true)
    expect(mockCanReadStudy).toHaveBeenCalledWith(user, study.id)
    expect(mockGetUserRoleOnStudy).toHaveBeenCalledWith(user, study)
  })

  it('should return false if user has a role on study and is a reader', async () => {
    const user = getMockedDbUser()
    const site = getMockedFullStudySite({ id: 'site-1' })
    const emissionSource = getMockedEmissionSource({ studySiteId: 'site-1' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(true)
    mockGetUserRoleOnStudy.mockReturnValue(StudyRole.Reader)

    const result = await hasStudyBasicRights(user, emissionSource, study)

    expect(result).toBe(false)
    expect(mockCanReadStudy).toHaveBeenCalledWith(user, study.id)
    expect(mockGetUserRoleOnStudy).toHaveBeenCalledWith(user, study)
  })

  it('should return false if user has no role on study', async () => {
    const user = getMockedDbUser()
    const site = getMockedFullStudySite({ id: 'site-1' })
    const emissionSource = getMockedEmissionSource({ studySiteId: 'site-1' })
    const study = getMockedFullStudy({ sites: [site] })

    mockCanReadStudy.mockReturnValue(true)
    mockGetUserRoleOnStudy.mockReturnValue(null)

    const result = await hasStudyBasicRights(user, emissionSource, study)

    expect(result).toBe(false)
    expect(mockCanReadStudy).toHaveBeenCalledWith(user, study.id)
    expect(mockGetUserRoleOnStudy).toHaveBeenCalledWith(user, study)
  })
})
