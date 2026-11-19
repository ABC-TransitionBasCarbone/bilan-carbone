import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import StudyNavbar from '@/components/studyNavbar/StudyNavbar'
import { getStudyForNavbar } from '@/db/study'
import { hasRoleOnStudy } from '@/services/permissions/environment'
import { canReadStudy, canReadStudyDetail } from '@/services/permissions/study'
import { isDeactivableFeatureActiveForEnvironment } from '@/services/serverFunctions/deactivableFeatures'
import { checkStudyHasObjectives } from '@/services/serverFunctions/trajectory.serverFunction'
import { getAccountRoleOnStudy } from '@/utils/study'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import { DeactivatableFeature, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
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

  const userRole = getAccountRoleOnStudy(user, study)
  const [transitionPlanFeature, objectivesResponse] = await Promise.all([
    isDeactivableFeatureActiveForEnvironment(DeactivatableFeature.TransitionPlan, environment),
    userRole === StudyRole.Reader ? null : checkStudyHasObjectives(id),
  ])

  const showRoleInChip = user && hasRoleOnStudy(user.environment)
  const isTransitionPlanActive = transitionPlanFeature.success && transitionPlanFeature.data
  const canAccessPlanSections =
    userRole === StudyRole.Reader ? !!study.transitionPlan : objectivesResponse?.success && objectivesResponse.data

  return (
    <>
      <div className="flex">
        <StudyNavbar
          environment={environment}
          studyId={id}
          studyName={study.name}
          studySimplified={study.simplified}
          isTransitionPlanActive={isTransitionPlanActive}
          canAccessPlanSections={!!canAccessPlanSections}
          userRole={showRoleInChip ? userRole : null}
        />
        <div className={styles.children}>{children}</div>
      </div>
    </>
  )
}

export default withAuth(NavLayout)
