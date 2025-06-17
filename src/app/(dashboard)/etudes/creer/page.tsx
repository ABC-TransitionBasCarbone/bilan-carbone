import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getAccountOrganizationVersions } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { getStudyById } from '@/db/study'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'

interface Props extends UserSessionProps {
  searchParams: Promise<{ duplicate?: string }>
}

const NewStudy = async ({ user, searchParams }: Props) => {
  if (!user.organizationVersionId || !user.level) {
    return <NotFound />
  }

  const params = await searchParams
  const duplicateStudyId = params.duplicate

  if (duplicateStudyId) {
    const sourceStudy = await getStudyById(duplicateStudyId, user.organizationVersionId)
    if (!sourceStudy) {
      return <NotFound />
    }

    const userRole = getAccountRoleOnStudy(user, sourceStudy)
    if (!hasEditionRights(userRole)) {
      return <NotFound />
    }
  }

  const [organizationVersions, accounts] = await Promise.all([
    getAccountOrganizationVersions(user.accountId),
    getOrganizationVersionAccounts(user.organizationVersionId),
  ])

  const userSettings = await getUserSettings()
  const caUnit = userSettings.success ? userSettings.data?.caUnit || defaultCAUnit : defaultCAUnit

  return (
    <NewStudyPage
      organizationVersions={organizationVersions}
      user={user}
      accounts={accounts}
      caUnit={caUnit}
      duplicateStudyId={duplicateStudyId ?? null}
    />
  )
}

export default withAuth(NewStudy)
