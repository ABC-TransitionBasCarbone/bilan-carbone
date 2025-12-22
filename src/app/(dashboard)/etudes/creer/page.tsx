import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyCreation, { StudyCreationProps } from '@/components/hoc/withStudyCreation'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getAccountOrganizationVersions } from '@/db/account'
import { getOrganizationVersionAccounts, getOrganizationVersionById } from '@/db/organization'
import { canCreateAStudy } from '@/services/permissions/study'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'
import { hasActiveLicence } from '@/utils/organization'
import { redirect } from 'next/navigation'

const NewStudy = async ({ user, duplicateStudyId, isSimplified }: UserSessionProps & StudyCreationProps) => {
  if (!user.organizationVersionId || canCreateAStudy(user, isSimplified)) {
    return <NotFound />
  }

  const [organizationVersions, accounts] = await Promise.all([
    getAccountOrganizationVersions(user.accountId),
    getOrganizationVersionAccounts(user.organizationVersionId),
  ])

  const organizationVersionId = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === user.organizationVersionId,
  )?.id

  if (organizationVersionId) {
    const organizationVersion = await getOrganizationVersionById(organizationVersionId)
    if (!organizationVersion || !hasActiveLicence(organizationVersion)) {
      redirect('/')
    }
  }

  const userSettings = await getUserSettings()
  const caUnit = userSettings.success ? userSettings.data?.caUnit || defaultCAUnit : defaultCAUnit

  return (
    <NewStudyPage
      organizationVersions={organizationVersions}
      user={user}
      accounts={accounts}
      caUnit={caUnit}
      duplicateStudyId={duplicateStudyId}
    />
  )
}

export default withAuth(withStudyCreation(NewStudy))
