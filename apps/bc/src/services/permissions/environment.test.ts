import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { Locale } from '@abc-transitionbascarbone/common/i18n/config'
import {
  getLocalesForEnv,
  hasAccessToAdvancedEmissionAnalysis,
  hasAccessToDependencyMatrix,
  hasAccessToEmissionFactorVersionSelection,
  hasAlwaysAccessToOrganizationVersion,
  hasSpecificExport,
  isTilt,
} from './environment'

describe('environment permissions', () => {
  it.each([
    [Environment.BC, true],
    [Environment.TILT, true],
    [Environment.COURSE_BC, true],
    [Environment.COURSE_TILT, true],
    [Environment.CUT, false],
    [Environment.CLICKSON, false],
    [Environment.MIP, false],
  ])('allows emission factor version selection in %s: %s', (environment, allowed) => {
    expect(hasAccessToEmissionFactorVersionSelection(environment)).toBe(allowed)
  })

  describe('COURSE_TILT fallback', () => {
    it('treats COURSE_TILT like TILT for tilt permissions', () => {
      expect(isTilt(Environment.COURSE_TILT)).toBe(true)
      expect(hasAccessToDependencyMatrix(Environment.COURSE_TILT)).toBe(true)
      expect(hasAccessToAdvancedEmissionAnalysis(Environment.COURSE_TILT)).toBe(true)
      expect(hasAlwaysAccessToOrganizationVersion(Environment.COURSE_TILT)).toBe(true)
      expect(hasSpecificExport(Environment.COURSE_TILT)).toBe(true)
      expect(getLocalesForEnv(Environment.COURSE_TILT)).toEqual([Locale.FR])
    })
  })
})
