import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import withStudyCreation, { StudyCreationProps } from '@/components/hoc/withStudyCreation'
import NewStudyPage from '@/components/pages/NewStudy'
import { getAccountOrganizationVersions } from '@/db/account'
import { isCourseProfessor } from '@/db/courseSession'
import { getEmissionFactorImportVersionsBC } from '@/db/emissionFactors'
import { getOrganizationVersionAccounts, getOrganizationVersionForRightsCheck } from '@/db/organization'
import { supportsStudyEmissionFactorVersionSelection } from '@/services/permissions/environment'
import { canCreateAStudy } from '@/services/permissions/study'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'
import { hasActiveLicence } from '@/utils/organization'
import NotFound from '@abc-transitionbascarbone/common/components/pages/NotFound'
import { Role } from '@abc-transitionbascarbone/common/db/enums'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'
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
  const canSelectEmissionFactorVersions =
    supportsStudyEmissionFactorVersionSelection(user.environment) &&
    (user.role === Role.SUPER_ADMIN ||
      (isCourseEnvironment(user.environment) &&
        (await isCourseProfessor(user.organizationVersionId, user.environment))))
  const emissionFactorVersions = canSelectEmissionFactorVersions
    ? (await getEmissionFactorImportVersionsBC(true)).map(({ id, source, name }) => ({ id, source, name }))
    : []

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
      canSelectEmissionFactorVersions={canSelectEmissionFactorVersions}
      emissionFactorVersions={emissionFactorVersions}
      defaultOrganizationVersion={organizationVersions.find((organizationVersion) => organizationVersion.id === id)}
      caUnit={caUnit}
      duplicateStudyId={props.duplicateStudyId}
    />
  )
}

export default withAuth(withStudyCreation(NewStudyInOrganization))
