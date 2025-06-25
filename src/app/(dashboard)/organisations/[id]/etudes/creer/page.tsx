import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyDuplication, { StudyDuplicationProps } from '@/components/hoc/withStudyDuplication'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getAccountOrganizationVersions } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { canCreateAStudy } from '@/services/permissions/study'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'

interface Props {
  params: Promise<{ id: string }>
}

const NewStudyInOrganization = async (props: Props & UserSessionProps & StudyDuplicationProps) => {
  const [params] = await Promise.all([props.params])

  const id = params.id
  const { user } = props

  if (!id || !canCreateAStudy(user)) {
    return <NotFound />
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
      defaultOrganizationVersion={organizationVersions.find((organizationVersion) => organizationVersion.id === id)}
      caUnit={caUnit}
      duplicateStudyId={props.duplicateStudyId}
    />
  )
}

export default withAuth(withStudyDuplication(NewStudyInOrganization))
