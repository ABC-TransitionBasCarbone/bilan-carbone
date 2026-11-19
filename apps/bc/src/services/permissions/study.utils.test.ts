import {
  getCorrectionTargets,
  getCorrectionTargetSnapshot,
  type CorrectionRecipient,
} from '@/services/studyCorrectionSharing'
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
  it('allows the professor organization to share its own correction with remaining recipients', () => {
    expect(canShareStudyCorrection(professor, correction)).toBe(true)

    const recipients: CorrectionRecipient[] = (['notSent', 'withoutPlan', 'withPlan'] as const).map((status) => ({
      id: status,
      organizationVersionId: `org-${status}`,
      firstName: 'Camille',
      lastName: 'Martin',
      status,
    }))
    const withoutPlan = getCorrectionTargets(recipients, false)
    const withPlan = getCorrectionTargets(recipients, true)
    expect(withoutPlan.map(({ id }) => id)).toEqual(['notSent'])
    expect(withPlan.map(({ id }) => id)).toEqual(['notSent', 'withoutPlan'])
    expect(getCorrectionTargetSnapshot(withPlan)).toBe(getCorrectionTargetSnapshot([...withPlan].reverse()))
    expect(getCorrectionTargetSnapshot(withPlan)).not.toBe(getCorrectionTargetSnapshot(withoutPlan))
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
