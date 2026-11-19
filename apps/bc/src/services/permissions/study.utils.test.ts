import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { canShareStudyCorrection } from './study.utils'

const professor = { environment: Environment.COURSE_BC, organizationVersionId: 'professor-org' }
const correction = {
  organizationVersion: {
    environment: Environment.COURSE_BC,
    parentId: professor.organizationVersionId,
    parent: { professorCourseSessions: [{ id: 'session' }] },
  },
}

describe('canShareStudyCorrection', () => {
  it('allows the professor organization to share its own correction', () => {
    expect(canShareStudyCorrection(professor, correction)).toBe(true)
  })

  it('does not allow another organization or training environment to share it', () => {
    expect(canShareStudyCorrection({ ...professor, organizationVersionId: 'other-org' }, correction)).toBe(false)
    expect(canShareStudyCorrection({ ...professor, environment: Environment.COURSE_TILT }, correction)).toBe(false)
  })

  it('does not allow sharing when the parent organization has no professor sessions', () => {
    expect(
      canShareStudyCorrection(professor, {
        ...correction,
        organizationVersion: { ...correction.organizationVersion, parent: { professorCourseSessions: [] } },
      }),
    ).toBe(false)
  })
})
