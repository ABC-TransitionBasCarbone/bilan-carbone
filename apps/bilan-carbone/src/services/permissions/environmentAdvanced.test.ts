import { Environment, Level } from '@abc-transitionbascarbone/db-common/enums'
import { hasAccessToEmissionFactors } from './environmentAdvanced'

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
})
