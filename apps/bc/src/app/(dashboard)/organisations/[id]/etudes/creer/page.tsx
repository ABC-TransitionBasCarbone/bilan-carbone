import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyCreation, { StudyCreationProps } from '@/components/hoc/withStudyCreation'
import NewStudyPage from '@/components/pages/NewStudy'
import { getAccountOrganizationVersions } from '@/db/account'
import { getOrganizationVersionAccounts, getOrganizationVersionForRightsCheck } from '@/db/organization'
import { getStudyCreationEmissionFactorVersions } from '@/db/study'
import { canCreateAStudy, canSelectEmissionFactorVersions } from '@/services/permissions/study'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'
import { hasActiveLicence } from '@/utils/organization'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

const NewStudyInOrganization = async (props: Props & UserSessionProps & StudyCreationProps) => {
  const [params] = await Promise.all([props.params])

  const id = params.id
  const { user, isSimplified } = props

  if (!id || !(await canCreateAStudy(user, isSimplified))) {
    return <NotFound />
  }

  const [organizationVersions, accounts] = await Promise.all([
    getAccountOrganizationVersions(user.accountId),
    getOrganizationVersionAccounts(user.organizationVersionId),
  ])
  const canSelectVersions = await canSelectEmissionFactorVersions(
    user.organizationVersionId,
    user.environment,
    user.role,
  )
  const emissionFactorVersions = canSelectVersions ? await getStudyCreationEmissionFactorVersions() : []

  const organizationVersionId = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === user.organizationVersionId,
  )?.id
  if (organizationVersionId) {
    const organizationVersion = await getOrganizationVersionForRightsCheck(organizationVersionId)
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
      canSelectEmissionFactorVersions={canSelectVersions}
      emissionFactorVersions={emissionFactorVersions}
      defaultOrganizationVersion={organizationVersions.find((organizationVersion) => organizationVersion.id === id)}
      caUnit={caUnit}
      duplicateStudyId={props.duplicateStudyId}
    />
  )
}

export default withAuth(withStudyCreation(NewStudyInOrganization))
