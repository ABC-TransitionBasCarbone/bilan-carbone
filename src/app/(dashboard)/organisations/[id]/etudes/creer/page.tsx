import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getAccountOrganizationVersions } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { getStudyById } from '@/db/study'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'
import { getAccountRoleOnStudy, hasEditionRights } from '@/utils/study'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ duplicate?: string }>
}

const NewStudyInOrganization = async (props: Props & UserSessionProps) => {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams])

  const id = params.id
  const duplicateStudyId = searchParams.duplicate

  if (!id || !props.user.organizationVersionId || !props.user.level) {
    return <NotFound />
  }

  if (duplicateStudyId) {
    const sourceStudy = await getStudyById(duplicateStudyId, props.user.organizationVersionId)
    if (!sourceStudy) {
      return <NotFound />
    }

    const userRole = getAccountRoleOnStudy(props.user, sourceStudy)
    if (!hasEditionRights(userRole)) {
      return <NotFound />
    }
  }

  const [organizationVersions, accounts] = await Promise.all([
    getAccountOrganizationVersions(props.user.accountId),
    getOrganizationVersionAccounts(props.user.organizationVersionId),
  ])

  const userSettings = await getUserSettings()
  const caUnit = userSettings.success ? userSettings.data?.caUnit || defaultCAUnit : defaultCAUnit

  return (
    <NewStudyPage
      organizationVersions={organizationVersions}
      user={props.user}
      accounts={accounts}
      defaultOrganizationVersion={organizationVersions.find((organizationVersion) => organizationVersion.id === id)}
      caUnit={caUnit}
      duplicateStudyId={duplicateStudyId ?? null}
    />
  )
}

export default withAuth(NewStudyInOrganization)
