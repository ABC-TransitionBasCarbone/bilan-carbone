import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getEnvironmentHandlingGenericEnvs } from './environments'

describe('getEnvironmentHandlingGenericEnvs', () => {
  it('preserves undefined', () => {
    const environment = getEnvironmentHandlingGenericEnvs(undefined)
    expect(environment).toBeUndefined()
  })

  it('preserves non-course environments', () => {
    const environment: Environment = getEnvironmentHandlingGenericEnvs(Environment.CUT)
    expect(environment).toBe(Environment.CUT)
  })

  it('returns the corresponding fallback for each course environment', () => {
    const bc: Environment = getEnvironmentHandlingGenericEnvs(Environment.COURSE_BC)
    const tilt: Environment = getEnvironmentHandlingGenericEnvs(Environment.COURSE_TILT)
    expect(bc).toBe(Environment.BC)
    expect(tilt).toBe(Environment.TILT)
  })

  it('preserves available course environments', () => {
    expect(getEnvironmentHandlingGenericEnvs(Environment.COURSE_BC, [Environment.COURSE_BC])).toBe(
      Environment.COURSE_BC,
    )
    expect(getEnvironmentHandlingGenericEnvs(Environment.COURSE_TILT, [Environment.COURSE_TILT])).toBe(
      Environment.COURSE_TILT,
    )
  })

  it('preserves undefined in a union with a course environment', () => {
    const inputs: (typeof Environment.COURSE_TILT | undefined)[] = [Environment.COURSE_TILT, undefined]
    const environments = inputs.map((input) => getEnvironmentHandlingGenericEnvs(input))
    const expectedType: (Environment | undefined)[] = environments
    expect(expectedType).toEqual([Environment.TILT, undefined])
  })
})
