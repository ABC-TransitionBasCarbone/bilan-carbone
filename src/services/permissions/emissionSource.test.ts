import { getMockedEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockedFullStudy } from '@/tests/utils/models/study'
import { getMockedDbUser } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { hasStudyBasicRights } from './emissionSource'
import * as studyModule from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))

jest.mock('./study', () => ({ canReadStudy: jest.fn() }))

const mockCanReadStudy = studyModule.canReadStudy as jest.Mock

describe('hasStudyBasicRights', () => {
  it('should return false if user cannot read study', async () => {
    const user = getMockedDbUser()
    const emissionSource = getMockedEmissionSource()
    const study = getMockedFullStudy()

    mockCanReadStudy.mockReturnValue(false)

    const result = await hasStudyBasicRights(user, emissionSource, study)

    expect(result).toBe(false)
    expect(mockCanReadStudy).toHaveBeenCalledWith(user, study.id)
  })

  it('should return false if site is not in study', async () => {})

  it('should return true if user has a role on study and is not a reader', async () => {})

  it('should return false if user has a role on study and is a reader', async () => {})
})
