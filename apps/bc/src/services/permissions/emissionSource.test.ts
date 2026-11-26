import { getEmissionFactorById } from '@/db/emissionFactors'
import { getStudyById, getStudySites } from '@/db/study'
import { getMockedEmissionSource } from '@/tests/utils/models/emissionSource'
import { getMockedFullStudy, getMockedFullStudySite } from '@/tests/utils/models/study'
import { getMockedAccount, getMockedDbAccount, getMockedDbUser } from '@/tests/utils/models/user'
import { AccountWithUser } from '@/types/account.types'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import {
  CourseSessionType,
  Environment,
  Role,
  StudyRole,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import * as studyUtilsModule from '../../utils/study'
import { canUpdateEmissionSource, hasStudyBasicRights } from './emissionSource'
import * as studyModule from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../file', () => ({ download: jest.fn() }))
jest.mock('../auth', () => ({ auth: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn() }))

jest.mock('@/db/emissionFactors', () => ({ getEmissionFactorById: jest.fn() }))
jest.mock('@/db/study', () => ({ getStudyById: jest.fn(), getStudySites: jest.fn() }))
jest.mock('./study', () => ({ canReadStudy: jest.fn() }))
jest.mock('../../utils/study', () => ({
  getAccountRoleOnStudy: jest.fn(),
  hasDeprecationPeriod: jest.fn().mockReturnValue(false),
  isCASSubPost: jest.fn().mockReturnValue(false),
}))
jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn(() => (key: string) => key),
}))

const mockCanReadStudy = studyModule.canReadStudy as jest.Mock
const mockGetAccountRoleOnStudy = studyUtilsModule.getAccountRoleOnStudy as jest.Mock
const mockGetStudyById = getStudyById as jest.Mock
const mockGetStudySites = getStudySites as jest.Mock
const mockGetEmissionFactorById = getEmissionFactorById as jest.Mock

describe('hasStudyBasicRights', () => {
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

describe.each([Environment.COURSE_BC, Environment.COURSE_TILT])('professor validation in %s', (environment) => {
  const professor: AccountWithUser = {
    ...getMockedAccount({ environment, organizationVersionId: 'professor-org', role: Role.COLLABORATOR }),
    organizationVersion: { organizationId: 'professor', environment },
    user: getMockedDbUser(),
  }
  const source = getMockedEmissionSource({
    studySiteId: 'study-site',
    emissionFactorId: 'emission-factor',
    source: 'Invoice',
    value: 1,
  })
  const study = getMockedFullStudy({
    isPublic: false,
    courseSessionType: CourseSessionType.INITIAL,
    organizationVersion: { ...getMockedFullStudy().organizationVersion, environment },
    createdBy: {
      environment,
      user: { firstName: 'Trainee', lastName: 'User' },
      organizationVersion: {
        traineeCourseSessions: [
          {
            courseSession: {
              type: CourseSessionType.INITIAL,
              environment,
              professorOrganizationVersionId: 'professor-org',
            },
          },
        ],
      },
    },
  })

  beforeEach(() => {
    mockCanReadStudy.mockResolvedValue(true)
    mockGetAccountRoleOnStudy.mockImplementation(jest.requireActual('../../utils/study').getAccountRoleOnStudy)
    mockGetStudyById.mockResolvedValue(study)
    mockGetStudySites.mockResolvedValue([{ id: source.studySiteId }])
    mockGetEmissionFactorById.mockResolvedValue({ unit: Unit.GWH })
  })

  it('allows the session professor to validate a complete source without explicit study rights', async () => {
    await expect(canUpdateEmissionSource(professor, source, { validated: true }, study)).resolves.toBe(true)
  })

  it('rejects validation when the professor is not assigned to the session, even as a contributor', async () => {
    const otherProfessor = { ...professor, organizationVersionId: 'other-professor-org' }
    const studyWithContributor = {
      ...study,
      contributors: [
        {
          accountId: otherProfessor.id,
          account: {
            id: otherProfessor.id,
            organizationVersion: null,
            user: otherProfessor.user,
          },
          subPost: source.subPost,
        },
      ],
    }

    await expect(
      canUpdateEmissionSource(otherProfessor, source, { validated: true }, studyWithContributor),
    ).resolves.toBe(false)
  })

  it('rejects validation of an incomplete source', async () => {
    await expect(
      canUpdateEmissionSource(professor, { ...source, source: null }, { validated: true }, study),
    ).resolves.toBe(false)
  })
})

describe('canUpdateEmissionSource', () => {
  const account: AccountWithUser = {
    ...getMockedAccount({ role: Role.COLLABORATOR }),
    organizationVersion: { organizationId: 'organization', environment: Environment.BC },
    user: getMockedDbUser(),
  }
  const source = getMockedEmissionSource({
    studySiteId: 'study-site',
    emissionFactorId: 'emission-factor',
    source: 'Invoice',
    value: 1,
  })
  const study = getMockedFullStudy()
  const contributor = {
    accountId: account.id,
    account: { id: account.id, organizationVersion: null, user: account.user },
    subPost: source.subPost,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCanReadStudy.mockResolvedValue(true)
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Editor)
    mockGetStudyById.mockResolvedValue(study)
    mockGetStudySites.mockResolvedValue([{ id: source.studySiteId }])
    mockGetEmissionFactorById.mockResolvedValue({ unit: Unit.GWH })
    jest
      .mocked(studyUtilsModule.hasDeprecationPeriod)
      .mockImplementation(
        jest.requireActual<typeof import('../../utils/study')>('../../utils/study').hasDeprecationPeriod,
      )
  })

  afterEach(() => {
    jest.mocked(studyUtilsModule.hasDeprecationPeriod).mockReturnValue(false)
  })

  it.each([Environment.BC, Environment.TILT, Environment.COURSE_BC, Environment.COURSE_TILT])(
    'allows editors to update an unvalidated source in %s',
    async (environment) => {
      await expect(
        canUpdateEmissionSource({ ...account, environment }, source, { name: 'Updated' }, study),
      ).resolves.toBe(true)
    },
  )

  it.each([StudyRole.Reader, null])('rejects an update for role %s without contributor rights', async (role) => {
    mockGetAccountRoleOnStudy.mockReturnValue(role)
    await expect(canUpdateEmissionSource(account, source, { name: 'Updated' }, study)).resolves.toBe(false)
  })

  it('rejects an update when the user cannot read the study', async () => {
    mockCanReadStudy.mockResolvedValue(false)
    await expect(canUpdateEmissionSource(account, source, { name: 'Updated' }, study)).resolves.toBe(false)
  })

  it('allows a contributor to edit their assigned subpost without study editing rights', async () => {
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Reader)
    await expect(
      canUpdateEmissionSource(account, source, { name: 'Updated' }, { ...study, contributors: [contributor] }),
    ).resolves.toBe(true)
  })

  it.each([
    [
      'another user',
      { ...contributor, account: { ...contributor.account, user: { ...account.user, email: 'other' } } },
    ],
    ['another subpost', { ...contributor, subPost: SubPost.Batiment }],
  ])('rejects contributor rights for %s', async (_label, otherContributor) => {
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Reader)
    await expect(
      canUpdateEmissionSource(account, source, { name: 'Updated' }, { ...study, contributors: [otherContributor] }),
    ).resolves.toBe(false)
  })

  it('rejects an update if the study cannot be found', async () => {
    mockGetStudyById.mockResolvedValue(null)
    await expect(canUpdateEmissionSource(account, source, { name: 'Updated' }, study)).resolves.toBe(false)
  })

  it('rejects an update if the source site does not belong to the study', async () => {
    mockGetStudySites.mockResolvedValue([{ id: 'other-site' }])
    await expect(canUpdateEmissionSource(account, source, { name: 'Updated' }, study)).resolves.toBe(false)
  })

  it.each([{ name: 'Updated' }, { validated: true }])(
    'rejects changes to a validated source unless it is unvalidated: %o',
    async (change) => {
      mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
      await expect(canUpdateEmissionSource(account, { ...source, validated: true }, change, study)).resolves.toBe(false)
    },
  )

  it('allows a validator to unvalidate a source', async () => {
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
    await expect(
      canUpdateEmissionSource(account, { ...source, validated: true }, { validated: false }, study),
    ).resolves.toBe(true)
  })

  it.each([StudyRole.Editor, StudyRole.Reader, null])(
    'rejects validation and unvalidation for non-validator role %s',
    async (role) => {
      mockGetAccountRoleOnStudy.mockReturnValue(role)
      const studyWithContributor = { ...study, contributors: [contributor] }
      await expect(canUpdateEmissionSource(account, source, { validated: true }, studyWithContributor)).resolves.toBe(
        false,
      )
      await expect(
        canUpdateEmissionSource(account, { ...source, validated: true }, { validated: false }, studyWithContributor),
      ).resolves.toBe(false)
    },
  )

  it('allows validation when the change completes the source', async () => {
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
    await expect(
      canUpdateEmissionSource(account, { ...source, source: null }, { source: 'Invoice', validated: true }, study),
    ).resolves.toBe(true)
  })

  it('rejects validation when the source remains incomplete', async () => {
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
    await expect(
      canUpdateEmissionSource(account, { ...source, source: null }, { validated: true }, study),
    ).resolves.toBe(false)
  })

  it('currently allows validation without an emission factor', async () => {
    mockGetAccountRoleOnStudy.mockReturnValue(StudyRole.Validator)
    await expect(
      canUpdateEmissionSource(account, { ...source, emissionFactorId: null }, { validated: true }, study),
    ).resolves.toBe(true)
  })

  it('allows depreciation periods for an eligible subpost', async () => {
    await expect(
      canUpdateEmissionSource(account, { ...source, subPost: SubPost.Batiment }, { depreciationPeriod: 10 }, study),
    ).resolves.toBe(true)
  })

  it('rejects depreciation periods for an ineligible subpost', async () => {
    await expect(canUpdateEmissionSource(account, source, { depreciationPeriod: 10 }, study)).resolves.toBe(false)
  })

  it.each([Environment.CUT, Environment.CLICKSON])(
    'allows updates in %s when the source belongs to the account organization',
    async (environment) => {
      await expect(
        canUpdateEmissionSource({ ...account, environment }, source, { name: 'Updated' }, study),
      ).resolves.toBe(true)
    },
  )

  it.each([Environment.CUT, Environment.CLICKSON])(
    'rejects updates in %s for another organization without contributor rights',
    async (environment) => {
      await expect(
        canUpdateEmissionSource(
          { ...account, environment, organizationVersionId: 'other-organization' },
          source,
          { name: 'Updated' },
          study,
        ),
      ).resolves.toBe(false)
    },
  )

  it.each([Environment.CUT, Environment.CLICKSON])(
    'rejects updates in %s when the study is missing or the site is invalid',
    async (environment) => {
      mockGetStudyById.mockResolvedValue(null)
      await expect(
        canUpdateEmissionSource({ ...account, environment }, source, { name: 'Updated' }, study),
      ).resolves.toBe(false)
      mockGetStudyById.mockResolvedValue(study)
      mockGetStudySites.mockResolvedValue([])
      await expect(
        canUpdateEmissionSource({ ...account, environment }, source, { name: 'Updated' }, study),
      ).resolves.toBe(false)
    },
  )

  it.each([
    [Environment.CUT, false],
    [Environment.CLICKSON, true],
  ])('handles contributor rights in %s', async (environment, allowed) => {
    await expect(
      canUpdateEmissionSource(
        { ...account, environment, organizationVersionId: 'other-organization' },
        source,
        { name: 'Updated' },
        { ...study, contributors: [contributor] },
      ),
    ).resolves.toBe(allowed)
  })

  it.each([
    ['another account', { ...contributor, accountId: 'other-account' }],
    ['another subpost', { ...contributor, subPost: SubPost.Batiment }],
  ])('rejects CLICKSON contributor rights for %s', async (_label, otherContributor) => {
    await expect(
      canUpdateEmissionSource(
        { ...account, environment: Environment.CLICKSON, organizationVersionId: 'other-organization' },
        source,
        { name: 'Updated' },
        { ...study, contributors: [otherContributor] },
      ),
    ).resolves.toBe(false)
  })

  it('rejects updates for unsupported environments', async () => {
    await expect(
      canUpdateEmissionSource({ ...account, environment: Environment.MIP }, source, { name: 'Updated' }, study),
    ).resolves.toBe(false)
  })
})
