import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDetails, { StudyProps } from '@/components/hoc/withStudyDetails'
import EngagementActionsPage from '@/components/pages/EngagementActionsPage'
import { hasEditAccessOnStudy } from '@/services/permissions/study'
import { getEngagementActionsWithStudyId } from '@/services/serverFunctions/study'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'

const EngagementActions = async ({ study, user }: StudyProps & UserSessionProps) => {
  const [actions, canEdit] = await Promise.all([
    getEngagementActionsWithStudyId(study.id),
    hasEditAccessOnStudy(study.id, { user }),
  ])

  if (!actions.success) {
    return <NotFound />
  }

  return <EngagementActionsPage study={study} actions={actions.data} canEdit={canEdit} />
}

export default withAuth(withStudyDetails(EngagementActions))
