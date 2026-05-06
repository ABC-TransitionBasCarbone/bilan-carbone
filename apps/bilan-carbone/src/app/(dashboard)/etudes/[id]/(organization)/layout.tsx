import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import StudyNavbar from '@/components/studyNavbar/StudyNavbar'
import { getStudyForNavbar } from '@/db/study'
import { hasRoleOnStudy } from '@/services/permissions/environment'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
import { isDeactivableFeatureActiveForEnvironment } from '@/services/serverFunctions/deactivableFeatures'
import { checkStudyHasObjectives } from '@/services/serverFunctions/trajectory.serverFunction'
import { getAccountRoleOnStudy } from '@/utils/study'
import { DeactivatableFeature } from '@abc-transitionbascarbone/db-common/enums'
import { UUID } from 'crypto'
import { redirect } from 'next/navigation'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: UUID }>
}

const NavLayout = async ({ children, params, user }: Props & UserSessionProps) => {
  const { id } = await params

  const study = await getStudyForNavbar(id)
  if (!study) {
    return <NotFound />
  }

  if (!(await canReadStudyDetail(user, study))) {
    if (!(await canReadStudy(user, id))) {
      return <NotFound />
    }
    redirect(`/etudes/${id}/contributeur`)
  }

  const environment = study.organizationVersion.environment

  const [transitionPlanFeature, objectivesResponse, userRole] = await Promise.all([
    isDeactivableFeatureActiveForEnvironment(DeactivatableFeature.TransitionPlan, environment),
    checkStudyHasObjectives(id),
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
          studyName={study.name}
          studySimplified={study.simplified}
          isTransitionPlanActive={isTransitionPlanActive}
          hasObjectives={hasObjectives}
          userRole={showRoleInChip ? userRole : null}
        />
        <div className={styles.children}>{children}</div>
      </div>
    </>
  )
}

export default withAuth(NavLayout)
