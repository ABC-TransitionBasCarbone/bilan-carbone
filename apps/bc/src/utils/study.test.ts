import * as situationServerModule from '@/services/serverFunctions/situation'
import { getMockedFullStudyEmissionSource } from '@/tests/utils/models/emissionSource'
import {
  getMockedFullStudy,
  getMockedFullStudySite,
  mockedEmissionSourceEmissionFactor,
} from '@/tests/utils/models/study'
import { getMockedAuthUser } from '@/tests/utils/models/user'
import * as UserUtilsModule from '@/utils/user'
import {
  CourseSessionType,
  EmissionFactorBase,
  Environment,
  Level,
  Role,
  StudyRole,
} from '@abc-transitionbascarbone/common/db/enums'
import { expect } from '@jest/globals'
import {
  getAccountRoleOnStudy,
  getBaseFilteredEmissionSources,
  getDuplicableEnvironments,
  getStudyDefaultLandingPath,
  getUserRoleOnPublicStudy,
  isProfessorOnStudy,
} from './study'

// TODO : remove these mocks. Should not be mocked but tests fail if not
jest.mock('../services/file', () => ({ download: jest.fn() }))
jest.mock('@/services/permissions/study.utils', () => ({ isAdminOnStudyOrga: jest.fn() }))
jest.mock('@/utils/user', () => ({ isAdmin: jest.fn() }))
jest.mock('@/services/serverFunctions/situation', () => ({ loadSituation: jest.fn() }))

const mockIsAdmin = UserUtilsModule.isAdmin as unknown as jest.Mock
const mockLoadSituation = jest.mocked(situationServerModule.loadSituation)

const emissionSources = [
  getMockedFullStudyEmissionSource({
    id: '1',
    emissionFactor: undefined,
  }),
  getMockedFullStudyEmissionSource({
    id: '2',
    emissionFactor: {
      ...mockedEmissionSourceEmissionFactor,
      base: null,
    },
  }),
  getMockedFullStudyEmissionSource({
    id: '3',
    emissionFactor: {
      ...mockedEmissionSourceEmissionFactor,
      base: EmissionFactorBase.LocationBased,
    },
  }),
  getMockedFullStudyEmissionSource({
    id: '4',
    emissionFactor: {
      ...mockedEmissionSourceEmissionFactor,
      base: EmissionFactorBase.MarketBased,
    },
  }),
]

const userMock = getMockedAuthUser()

describe('professor study permissions', () => {
  const professor = { ...userMock, environment: Environment.COURSE_BC, organizationVersionId: 'professor-org' }
  const study = getMockedFullStudy({
    courseSessionType: CourseSessionType.INITIAL,
    isPublic: false,
    allowedUsers: [],
    organizationVersion: {
      ...getMockedFullStudy().organizationVersion,
      environment: Environment.COURSE_BC,
    },
    createdBy: {
      environment: Environment.COURSE_BC,
      user: { firstName: 'Camille', lastName: 'Martin' },
      organizationVersion: {
        traineeCourseSessions: [
          {
            courseSession: {
              type: CourseSessionType.INITIAL,
              environment: Environment.COURSE_BC,
              professorOrganizationVersionId: professor.organizationVersionId,
            },
          },
        ],
      },
    },
  })

  it('grants only Reader to the current session professor', () => {
    expect(isProfessorOnStudy(professor, study)).toBe(true)
    expect(getAccountRoleOnStudy(professor, study)).toBe(StudyRole.Reader)
  })

  it('does not grant access to another professor or an account without an organization', () => {
    expect(isProfessorOnStudy({ ...professor, organizationVersionId: 'other' }, study)).toBe(false)
    expect(isProfessorOnStudy({ ...professor, organizationVersionId: null }, study)).toBe(false)
  })

  it('does not expose other training types or untyped studies', () => {
    expect(isProfessorOnStudy(professor, { ...study, courseSessionType: CourseSessionType.PROFESSIONNEL })).toBe(false)
    expect(isProfessorOnStudy(professor, { ...study, courseSessionType: null })).toBe(false)
  })

  it.each([Environment.BC, Environment.TILT, Environment.CUT, Environment.CLICKSON, Environment.MIP])(
    'does not grant professor access outside training environments: %s',
    (environment) => {
      expect(isProfessorOnStudy({ ...professor, environment }, study)).toBe(false)
    },
  )

  it('requires matching environments on the study, creator and session', () => {
    expect(isProfessorOnStudy({ ...professor, environment: Environment.COURSE_TILT }, study)).toBe(false)
    expect(
      isProfessorOnStudy(professor, {
        ...study,
        createdBy: { ...study.createdBy, environment: Environment.COURSE_TILT },
      }),
    ).toBe(false)
    expect(
      isProfessorOnStudy(professor, {
        ...study,
        organizationVersion: { ...study.organizationVersion, environment: Environment.COURSE_TILT },
      }),
    ).toBe(false)
  })

  it('revokes implicit access as soon as the registration is removed', () => {
    expect(
      isProfessorOnStudy(professor, {
        ...study,
        createdBy: { ...study.createdBy, organizationVersion: { traineeCourseSessions: [] } },
      }),
    ).toBe(false)
  })

  it('does not grant Editor on simplified COURSE_TILT studies', () => {
    const tiltStudy = {
      ...study,
      simplified: true,
      organizationVersion: { ...study.organizationVersion, environment: Environment.COURSE_TILT },
      createdBy: {
        ...study.createdBy,
        environment: Environment.COURSE_TILT,
        organizationVersion: {
          traineeCourseSessions: [
            {
              courseSession: {
                type: CourseSessionType.INITIAL,
                environment: Environment.COURSE_TILT,
                professorOrganizationVersionId: professor.organizationVersionId,
              },
            },
          ],
        },
      },
    }

    expect(getAccountRoleOnStudy({ ...professor, environment: Environment.COURSE_TILT }, tiltStudy)).toBe(
      StudyRole.Reader,
    )
  })
})

describe('StudyUtils functions', () => {
  describe('getDuplicableEnvironments', () => {
    test('Should return Tilt and BC for BC environment', () => {
      const res = getDuplicableEnvironments(Environment.BC)
      expect(res.length).toBe(2)
      expect(res[0]).toContain(Environment.BC)
      expect(res[1]).toContain(Environment.TILT)
    })

    test('Should return BC and Tilt for Tilt environment', () => {
      const res = getDuplicableEnvironments(Environment.TILT)
      expect(res.length).toBe(2)
      expect(res).toContain(Environment.TILT)
      expect(res).toContain(Environment.BC)
    })

    test('Should only return Count for Count environment', () => {
      const res = getDuplicableEnvironments(Environment.CUT)
      expect(res.length).toBe(1)
      expect(res[0]).toBe(Environment.CUT)
    })
  })

  describe('getUserRoleOnPublicStudy', () => {
    it('should return Validator for admin user with sufficient level', () => {
      mockIsAdmin.mockReturnValue(true)
      const user = { ...userMock, level: Level.Initial }

      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Validator')
    })

    it('should return Reader for admin user with not sufficient level', () => {
      mockIsAdmin.mockReturnValue(true)
      const user = { ...userMock, level: null }

      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Reader')
    })

    it('should return Editor if environment is CUT', () => {
      mockIsAdmin.mockReturnValue(false)
      const user = { ...userMock, environment: Environment.CUT }
      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Editor')
    })

    it('should return Editor for collaborator with sufficient level in non CUT environment', () => {
      mockIsAdmin.mockReturnValue(false)
      const user = { ...userMock, role: Role.COLLABORATOR, environment: Environment.BC, level: Level.Initial }

      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Editor')
    })

    it('should return Reader for collaborator with not sufficient level in non CUT environment', () => {
      mockIsAdmin.mockReturnValue(false)
      const user = { ...userMock, role: Role.COLLABORATOR, environment: Environment.BC, level: null }

      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Reader')
    })

    it('should return Reader for non collaborator in non CUT environment', () => {
      mockIsAdmin.mockReturnValue(false)
      const user = { ...userMock, role: Role.DEFAULT, environment: Environment.BC }

      const res = getUserRoleOnPublicStudy(user, Level.Initial)

      expect(res).toBe('Reader')
    })
  })

  describe('getBaseFilteredEmissionSources', () => {
    it('Should filter market-based emission source by default', () => {
      const res = getBaseFilteredEmissionSources(emissionSources)
      expect(res).toHaveLength(3)
      expect(res[0].id).toBe('1')
      expect(res[1].id).toBe('2')
      expect(res[2].id).toBe('3')
    })

    it('Should filter market-based emission source', () => {
      const res = getBaseFilteredEmissionSources(emissionSources, EmissionFactorBase.LocationBased)
      expect(res).toHaveLength(3)
      expect(res[0].id).toBe('1')
      expect(res[1].id).toBe('2')
      expect(res[2].id).toBe('3')
    })

    it('Should return all ES if markerBased', () => {
      const res = getBaseFilteredEmissionSources(emissionSources, EmissionFactorBase.MarketBased)
      expect(res).toHaveLength(4)
      expect(res[0].id).toBe('1')
      expect(res[1].id).toBe('2')
      expect(res[2].id).toBe('3')
      expect(res[3].id).toBe('4')
    })
  })

  describe('getStudyDefaultLandingPath', () => {
    it('redirects BC advanced studies to data entry', async () => {
      expect(await getStudyDefaultLandingPath(Environment.BC, 'study-id', [], false)).toBe(
        '/etudes/study-id/comptabilisation/saisie-des-donnees',
      )
    })

    it('redirects CUT studies to framing', async () => {
      expect(await getStudyDefaultLandingPath(Environment.CUT, 'study-id', [], true)).toBe('/etudes/study-id/cadrage')
    })

    it('redirects simplified TILT to framing when general data is incomplete', async () => {
      mockLoadSituation.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'situation-id',
          situation: { 'général . code postal': '75001' },
          listLayoutSituations: {},
          studySiteId: 'mocked-study-site-id',
          publicodesVersion: '1.0',
          modelVersion: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      expect(await getStudyDefaultLandingPath(Environment.TILT, 'study-id', [getMockedFullStudySite()], true)).toBe(
        '/etudes/study-id/cadrage',
      )
    })

    it('redirects simplified TILT to data entry when general data is complete', async () => {
      mockLoadSituation.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'situation-id',
          situation: { 'général . code postal': '75001', 'général . type': "'Club de loisirs'" },
          listLayoutSituations: {},
          studySiteId: 'mocked-study-site-id',
          publicodesVersion: '1.0',
          modelVersion: '1.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
      expect(await getStudyDefaultLandingPath(Environment.TILT, 'study-id', [getMockedFullStudySite()], true)).toBe(
        '/etudes/study-id/comptabilisation/saisie-des-donnees',
      )
    })
  })
})
