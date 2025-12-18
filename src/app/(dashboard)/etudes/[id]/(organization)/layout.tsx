import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { StudyProps } from '@/components/hoc/withStudy'
import WithStudyDetails from '@/components/hoc/withStudyDetails'
import StudyNavbar from '@/components/studyNavbar/StudyNavbar'
import { hasRoleOnStudy } from '@/services/permissions/environment'
import { isDeactivableFeatureActiveForEnvironment } from '@/services/serverFunctions/deactivableFeatures'
import { checkStudyHasObjectives } from '@/services/serverFunctions/trajectory'
import { getAccountRoleOnStudy } from '@/utils/study'
import { DeactivatableFeature } from '@prisma/client'
import { UUID } from 'crypto'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: UUID }>
}

const NavLayout = async ({ children, params, study, user }: Props & StudyProps & UserSessionProps) => {
  const { id } = await params
  const environment = study.organizationVersion.environment

  const [transitionPlanFeature, objectivesResponse, userRole] = await Promise.all([
    isDeactivableFeatureActiveForEnvironment(DeactivatableFeature.TransitionPlan, environment),
    checkStudyHasObjectives(study.id),
    getAccountRoleOnStudy(user, study),
  ])

  const showRoleInChip = user && hasRoleOnStudy(user.environment)
  const isTransitionPlanActive = transitionPlanFeature.success && transitionPlanFeature.data
  const hasObjectives = objectivesResponse.success ? objectivesResponse.data : false

  return (
    <>
      <div className="flex">
        <StudyNavbar
          environment={environment}
          studyId={id}
          study={study}
          isTransitionPlanActive={isTransitionPlanActive}
          hasObjectives={hasObjectives}
          userRole={showRoleInChip ? userRole : null}
        />
        <div className={styles.children}>{children}</div>
      </div>
    </>
  )
}

export default withAuth(WithStudyDetails(NavLayout))
