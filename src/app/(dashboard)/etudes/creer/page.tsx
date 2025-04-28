import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NewStudyPage from '@/components/pages/NewStudy'
import NotFound from '@/components/pages/NotFound'
import { getOrganizationUsers } from '@/db/organization'
import { getUserOrganizations } from '@/db/user'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultCAUnit } from '@/utils/number'

const NewStudy = async ({ user }: UserProps) => {
  if (!user.organizationId || !user.level) {
    return <NotFound />
  }

  const [organizations, users] = await Promise.all([
    getUserOrganizations(user.email),
    getOrganizationUsers(user.organizationId),
  ])

  const caUnit = (await getUserSettings())?.caUnit || defaultCAUnit

  return <NewStudyPage organizations={organizations} user={user} users={users} caUnit={caUnit} />
}

export default withAuth(NewStudy)
