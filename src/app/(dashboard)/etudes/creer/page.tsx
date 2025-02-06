import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import { getOrganizationUsers } from '@/db/organization'
import { getUserOrganizations } from '@/db/user'
import { getUserSettings } from '@/services/serverFunctions/user'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'

const NewStudy = async ({ user }: UserProps) => {
  if (!user.organizationId) {
    return null
  }

  const [organizations, users] = await Promise.all([
    getUserOrganizations(user.email),
    getOrganizationUsers(user.organizationId),
  ])

  const userCAUnit = (await getUserSettings())?.caUnit
  const caUnit = userCAUnit ? CA_UNIT_VALUES[userCAUnit] : defaultCAUnit

  return (
    <NewStudyPage
      organizations={organizations}
      user={user}
      usersEmail={users.map((user) => user.email)}
      caUnit={caUnit}
    />
  )
}

export default withAuth(NewStudy)
