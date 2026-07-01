import { Environment, Level } from '@abc-transitionbascarbone/db-common/enums'
import {
  getStudyDefaultLandingPath,
  hasAccessToEmissionFactors,
  hasCompletedTiltSimplifiedGeneralData,
} from './environmentAdvanced'

describe('environmentAdvanced permissions', () => {
  describe('hasAccessToEmissionFactors', () => {
    it('allows BC users', () => {
      expect(hasAccessToEmissionFactors(Environment.BC, null)).toBe(true)
    })

    it('allows CLICKSON users', () => {
      expect(hasAccessToEmissionFactors(Environment.CLICKSON, null)).toBe(true)
    })

    it('allows trained TILT users', () => {
      expect(hasAccessToEmissionFactors(Environment.TILT, Level.Initial)).toBe(true)
    })

    it('forbids untrained TILT users', () => {
      expect(hasAccessToEmissionFactors(Environment.TILT, null)).toBe(false)
    })

    it('forbids CUT users', () => {
      expect(hasAccessToEmissionFactors(Environment.CUT, Level.Advanced)).toBe(false)
    })
  })

  describe('hasCompletedTiltSimplifiedGeneralData', () => {
    it('returns true when required keys are present and non-empty', () => {
      expect(
        hasCompletedTiltSimplifiedGeneralData({
          'général . code postal': '75001',
          'général . type': "'Club de loisirs'",
        }),
      ).toBe(true)
    })

    it('returns false when required keys are missing', () => {
      expect(
        hasCompletedTiltSimplifiedGeneralData({
          'général . code postal': '75001',
        }),
      ).toBe(false)
    })
  })

  describe('getStudyDefaultLandingPath', () => {
    it('redirects BC advanced studies to data entry', () => {
      expect(getStudyDefaultLandingPath(Environment.BC, 'study-id', false)).toBe(
        '/etudes/study-id/comptabilisation/saisie-des-donnees',
      )
    })

    it('redirects CUT studies to framing', () => {
      expect(getStudyDefaultLandingPath(Environment.CUT, 'study-id', true)).toBe('/etudes/study-id/cadrage')
    })

    it('redirects simplified TILT to framing when general data is incomplete', () => {
      expect(getStudyDefaultLandingPath(Environment.TILT, 'study-id', true, false)).toBe('/etudes/study-id/cadrage')
    })

    it('redirects simplified TILT to data entry when general data is complete', () => {
      expect(getStudyDefaultLandingPath(Environment.TILT, 'study-id', true, true)).toBe(
        '/etudes/study-id/comptabilisation/saisie-des-donnees',
      )
    })
  })
})
