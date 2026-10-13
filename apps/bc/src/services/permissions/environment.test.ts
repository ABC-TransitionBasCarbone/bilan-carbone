import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { Locale } from '@abc-transitionbascarbone/common/i18n/config'
import {
  getLocalesForEnv,
  hasAccessToAdvancedEmissionAnalysis,
  hasAccessToDependencyMatrix,
  hasAlwaysAccessToOrganizationVersion,
  hasSpecificExport,
  isTilt,
} from './environment'

describe('environment permissions', () => {
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
