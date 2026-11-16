import { DeactivatableFeature, Environment } from '@abc-transitionbascarbone/common/db/enums'
import { expect, jest } from '@jest/globals'

jest.doMock('server-only', () => ({}))
jest.doMock('@/db/deactivableFeatures', () => ({
  isFeatureActiveForEnvironment: jest.fn(),
}))

const { isFeatureActiveForEnvironment } = require('@/db/deactivableFeatures')
const { isTiltSimplifiedFeatureActive } = require('./environmentFeature')

describe('isTiltSimplifiedFeatureActive', () => {
  it('checks the generic TILT environment for training accounts', async () => {
    jest.mocked(isFeatureActiveForEnvironment).mockResolvedValue(true)

    await expect(isTiltSimplifiedFeatureActive(Environment.COURSE_TILT)).resolves.toBe(true)
    expect(isFeatureActiveForEnvironment).toHaveBeenCalledWith(DeactivatableFeature.TiltSimplified, Environment.TILT)
  })
})
