import { getMockedAuthUser } from '@/tests/utils/models/user'
import { expect } from '@jest/globals'
import { Environment, Role } from '@prisma/client'
import {
  canEditOrganizationVersion,
  hasActiveLicence,
  hasActiveLicenceForFormation,
  hasEditionRole,
  isAdminOnOrga,
  isBeforeBlockingDate,
  isInOrgaOrParent,
  isLicenceActiveForDate,
  isLicenceActiveForFormation,
} from './organization'

describe('organisation utils', () => {
  describe('isAdminOnOrga', () => {
    it('should return true if user is admin and in organization', () => {
      const user = getMockedAuthUser({ role: Role.ADMIN })
      const organizationVersion = { id: user.organizationVersionId ?? '', parentId: null }

      const result = isAdminOnOrga(user, organizationVersion)

      expect(result).toBe(true)
    })

    it('should return true if user is admin and in parent organization', () => {
      const user = getMockedAuthUser({ role: Role.ADMIN, organizationVersionId: 'parent-org-version-id' })
      const organizationVersion = { id: 'child-org-version-id', parentId: 'parent-org-version-id' }

      const result = isAdminOnOrga(user, organizationVersion)

      expect(result).toBe(true)
    })

    it('should return false if user is admin but not in organization or parent', () => {
      const user = getMockedAuthUser({ role: Role.ADMIN, organizationVersionId: 'some-other-org-version-id' })
      const organizationVersion = { id: 'child-org-version-id', parentId: 'parent-org-version-id' }

      const result = isAdminOnOrga(user, organizationVersion)

      expect(result).toBe(false)
    })

    it('should return false if user is not admin', () => {
      const user = getMockedAuthUser({ role: Role.GESTIONNAIRE })
      const organizationVersion = { id: user.organizationVersionId ?? '', parentId: user.organizationVersionId ?? '' }

      const result = isAdminOnOrga(user, organizationVersion)

      expect(result).toBe(false)
    })
  })

  describe('isInOrgaOrParent', () => {
    it('should return true if user is in organization', () => {
      const userOrganizationVersionId = 'org-version-id'
      const organizationVersion = { id: 'org-version-id', parentId: null }

      const result = isInOrgaOrParent(userOrganizationVersionId, organizationVersion)

      expect(result).toBe(true)
    })

    it('should return true if user is in parent organization', () => {
      const userOrganizationVersionId = 'parent-org-version-id'
      const organizationVersion = { id: 'child-org-version-id', parentId: 'parent-org-version-id' }

      const result = isInOrgaOrParent(userOrganizationVersionId, organizationVersion)

      expect(result).toBe(true)
    })

    it('should return false if user is not in organization or parent', () => {
      const userOrganizationVersionId = 'some-other-org-version-id'
      const organizationVersion = { id: 'child-org-version-id', parentId: 'parent-org-version-id' }

      const result = isInOrgaOrParent(userOrganizationVersionId, organizationVersion)

      expect(result).toBe(false)
    })

    it('should return false if userOrganizationVersionId is null', () => {
      const userOrganizationVersionId = null
      const organizationVersion = { id: 'org-version-id', parentId: 'parent-id' }

      const result = isInOrgaOrParent(userOrganizationVersionId, organizationVersion)

      expect(result).toBe(null)
    })
  })

  describe('hasEditionRole', () => {
    it('should return true for CR organization with non-default role and false for default role', () => {
      expect(hasEditionRole(true, Role.ADMIN)).toBe(true)
      expect(hasEditionRole(true, Role.GESTIONNAIRE)).toBe(true)
      expect(hasEditionRole(true, Role.COLLABORATOR)).toBe(true)
      expect(hasEditionRole(true, Role.DEFAULT)).toBe(false)
    })

    it('should return true for non-CR organization with admin or gestionnaire role and false for collaborator and default roles', () => {
      expect(hasEditionRole(false, Role.ADMIN)).toBe(true)
      expect(hasEditionRole(false, Role.GESTIONNAIRE)).toBe(true)
      expect(hasEditionRole(false, Role.COLLABORATOR)).toBe(false)
      expect(hasEditionRole(false, Role.DEFAULT)).toBe(false)
    })
  })

  describe('canEditOrganizationVersion', () => {
    it('should return false if user is not in organization or parent', () => {
      const user = getMockedAuthUser({ role: Role.ADMIN, organizationVersionId: 'some-other-org-version-id' })
      const organizationVersion = { id: 'child-org-version-id', parentId: 'parent-org-version-id' }

      const result = canEditOrganizationVersion(user, organizationVersion)

      expect(result).toBe(false)
    })

    it('should return true for CR organization with edition role', () => {
      const user = getMockedAuthUser({ role: Role.GESTIONNAIRE, organizationVersionId: 'parent-org-version-id' })
      const organizationVersion = { id: 'child-org-version-id', parentId: 'parent-org-version-id' }

      const result = canEditOrganizationVersion(user, organizationVersion)
      expect(result).toBe(true)
    })

    it('should return false for CR organization without edition role', () => {
      const user = getMockedAuthUser({ role: Role.DEFAULT, organizationVersionId: 'parent-org-version-id' })
      const organizationVersion = { id: 'child-org-version-id', parentId: 'parent-org-version-id' }

      const result = canEditOrganizationVersion(user, organizationVersion)

      expect(result).toBe(false)
    })

    it('should return true for non-CR organization with edition role', () => {
      const user = getMockedAuthUser({ role: Role.ADMIN, organizationVersionId: 'org-version-id' })
      const organizationVersion = { id: 'org-version-id', parentId: null }

      const result = canEditOrganizationVersion(user, organizationVersion)

      expect(result).toBe(true)
    })

    it('should return false for non-CR organization without edition role', () => {
      const user = getMockedAuthUser({ role: Role.COLLABORATOR, organizationVersionId: 'org-version-id' })
      const organizationVersion = { id: 'org-version-id', parentId: null }

      const result = canEditOrganizationVersion(user, organizationVersion)

      expect(result).toBe(false)
    })
  })

  describe('hasActiveLicence', () => {
    it('should return true if environment does not need licence', () => {
      expect(hasActiveLicence({ activatedLicence: [], parent: null, environment: Environment.CUT })).toBe(true)
      expect(hasActiveLicence({ activatedLicence: [], parent: null, environment: Environment.CLICKSON })).toBe(true)
      expect(hasActiveLicence({ activatedLicence: [], parent: null, environment: Environment.TILT })).toBe(true)
    })

    it('should return true if licence is active for orgaVersion', () => {
      expect(
        hasActiveLicence({ activatedLicence: [new Date().getFullYear()], parent: null, environment: Environment.BC }),
      ).toBe(true)
    })

    it('should return true if licence is active for parent orgaVersion', () => {
      expect(
        hasActiveLicence({
          activatedLicence: [],
          parent: { activatedLicence: [new Date().getFullYear()] },
          environment: Environment.BC,
        }),
      ).toBe(true)
    })

    it('should return false if licence is inactive for orgaVersion', () => {
      expect(hasActiveLicence({ activatedLicence: [], parent: null, environment: Environment.BC })).toBe(false)
    })

    it('should return false if licence is inactive for parent orgaVersion', () => {
      expect(
        hasActiveLicence({
          activatedLicence: [],
          parent: { activatedLicence: [] },
          environment: Environment.BC,
        }),
      ).toBe(false)
    })
  })

  describe('hasActiveLicenceForFormation', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-15'))
      process.env.MEMBERSHIP_BLOCKING_DATE = '15/02'
    })

    afterEach(() => {
      jest.useRealTimers()
      delete process.env.MEMBERSHIP_BLOCKING_DATE
    })

    it('should return true if licence is active for orgaVersion', () => {
      expect(
        hasActiveLicenceForFormation({
          activatedLicence: [2025],
          parent: null,
          environment: Environment.BC,
        }),
      ).toBe(true)
    })

    it('should return true if licence is active for parent orgaVersion', () => {
      expect(
        hasActiveLicenceForFormation({
          activatedLicence: [],
          parent: { activatedLicence: [2000, 2025] },
          environment: Environment.BC,
        }),
      ).toBe(true)
    })

    it('should return false if licence is inactive for orgaVersion', () => {
      expect(hasActiveLicenceForFormation({ activatedLicence: [], parent: null, environment: Environment.BC })).toBe(
        false,
      )
    })

    it('should return false if licence is inactive for parent orgaVersion', () => {
      expect(
        hasActiveLicenceForFormation({
          activatedLicence: [],
          parent: { activatedLicence: [] },
          environment: Environment.BC,
        }),
      ).toBe(false)
    })
  })

  describe('isLicenceActiveForDate', () => {
    it('should return true if current year is in activatedLicence array', () => {
      process.env.MEMBERSHIP_BLOCKING_DATE = '01/01'
      expect(isLicenceActiveForDate([2022, 2023, new Date().getFullYear() - 1, new Date().getFullYear()])).toBe(true)
      expect(isLicenceActiveForDate([new Date().getFullYear()])).toBe(true)
    })

    it('should return false if current year and previous year is not in activatedLicence array', () => {
      expect(isLicenceActiveForDate([2022, 2023])).toBe(false)
      expect(isLicenceActiveForDate([])).toBe(false)
    })

    it('should return true if has previous year in activatedLicence array and before blocking date', () => {
      process.env.MEMBERSHIP_BLOCKING_DATE = '31/12'

      expect(isLicenceActiveForDate([new Date().getFullYear() - 1])).toBe(true)
    })

    it('should return false if has previous year in activatedLicence array and after blocking date', () => {
      process.env.MEMBERSHIP_BLOCKING_DATE = '01/01'

      expect(isLicenceActiveForDate([new Date().getFullYear() - 1])).toBe(false)
    })
  })

  describe('isBeforeBlockingDate', () => {
    beforeEach(() => {
      process.env.MEMBERSHIP_BLOCKING_DATE = '15/02'
    })

    it('should return true if is the day before', () => {
      const date = new Date()
      date.setDate(14)
      date.setMonth(1)
      expect(isBeforeBlockingDate(date)).toBe(true)
    })

    it('should return true if is the current day', () => {
      const date = new Date()
      date.setDate(15)
      date.setMonth(1)
      expect(isBeforeBlockingDate(date)).toBe(true)
    })

    it('should return false if is the day after', () => {
      const date = new Date()
      date.setDate(16)
      date.setMonth(1)
      expect(isBeforeBlockingDate(date)).toBe(false)
    })
  })

  describe('isLicenceActiveForFormation', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-01-15'))
    })

    afterEach(() => {
      jest.useRealTimers()
      delete process.env.MEMBERSHIP_BLOCKING_DATE
    })

    it('should return true if 2025 is in activatedLicence array and before blocking date', () => {
      process.env.MEMBERSHIP_BLOCKING_DATE = '31/12'

      expect(isLicenceActiveForFormation([2025])).toBe(true)
      expect(isLicenceActiveForFormation([2025, 2026])).toBe(true)
    })

    it('should return false if 2025 is not in activatedLicence array', () => {
      expect(isLicenceActiveForFormation([2022, 2024, 2026])).toBe(false)
      expect(isLicenceActiveForFormation([])).toBe(false)
    })

    it('should return false if 2025 is in activatedLicence array and after blocking date', () => {
      process.env.MEMBERSHIP_BLOCKING_DATE = '01/01'
      expect(isLicenceActiveForFormation([2025])).toBe(false)
      expect(isLicenceActiveForFormation([2025, 2026])).toBe(false)
    })

    it('should return true if has 2025 and we are still in 2025', () => {
      process.env.MEMBERSHIP_BLOCKING_DATE = '01/01'
      jest.setSystemTime(new Date('2025-12-25'))
      expect(isLicenceActiveForFormation([2025])).toBe(true)
      expect(isLicenceActiveForFormation([2025, 2026])).toBe(true)
    })
  })
})
