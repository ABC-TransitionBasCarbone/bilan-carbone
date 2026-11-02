import { StudyCardItem } from '@/db/study'
import { isTilt } from '@/services/permissions/environment'
import { canCreateAStudy } from '@/services/permissions/study'
import { UserSession } from 'next-auth'
import Studies from './Studies'

interface Props {
  user: UserSession
  advancedStudies: StudyCardItem[]
  simplifiedStudies: StudyCardItem[]
  collaborationStudies: StudyCardItem[]
  displaySimplifiedStudies: boolean
  activeLicence: boolean
  creationUrl: string
  creationUrlSimplified: string
  organizationVersionId?: string
  isCR?: boolean
}

const StudiesList = async ({
  user,
  advancedStudies,
  simplifiedStudies,
  collaborationStudies,
  displaySimplifiedStudies,
  activeLicence,
  creationUrl,
  creationUrlSimplified,
  organizationVersionId,
  isCR,
}: Props) => (
  <>
    {!!advancedStudies.length && (
      <Studies
        studies={advancedStudies}
        canAddStudy={(await canCreateAStudy(user)) && !isCR && activeLicence}
        creationUrl={creationUrl}
        user={user}
        collaborations={!organizationVersionId && isCR}
      />
    )}
    {displaySimplifiedStudies && !!simplifiedStudies.length && (
      <Studies
        studies={simplifiedStudies}
        canAddStudy={(await canCreateAStudy(user, true)) && !isCR && activeLicence}
        creationUrl={creationUrlSimplified}
        user={user}
        collaborations={!organizationVersionId && isCR}
        simplified
        showBetaBanner={isTilt(user.environment) && displaySimplifiedStudies}
      />
    )}
    {!!collaborationStudies.length && (
      <Studies studies={collaborationStudies} canAddStudy={false} user={user} collaborations />
    )}
  </>
)

export default StudiesList
