import { getUserOrganizations, hasUserToValidateInOrganization } from '@/db/user'
import { default as CUTLogosHome } from '@/environments/cut/home/LogosHome'
import { canEditMemberRole } from '@/utils/organization'
import { User } from 'next-auth'
import Onboarding from '../onboarding/Onboarding'
import StudiesContainer from '../study/StudiesContainer'
import CRClientsList from './CRClientsList'
import UserToValidate from './UserToValidate'
import ActualitiesCards from '../actuality/ActualitiesCards'
import { CUT, getServerEnvironment } from '@/store/AppEnvironment'

interface Props {
  user: User
}

const UserView = async ({ user }: Props) => {
  const environment = getServerEnvironment();
  const [organizations, hasUserToValidate] = await Promise.all([
    getUserOrganizations(user.email),
    hasUserToValidateInOrganization(user.organizationId),
  ])

  const userOrganization = organizations.find((organization) => organization.id === user.organizationId)
  const isCR = userOrganization?.isCR
  return (
    <>
      {!!hasUserToValidate && canEditMemberRole(user) && (
        <div className="main-container mb1">
          <UserToValidate />
        </div>
      )}
      {isCR && (
        <CRClientsList
          organizations={organizations.filter((organization) => organization.id !== user.organizationId)}
        />
      )}
      <StudiesContainer user={user} isCR={isCR} />

      {environment !== CUT && (<ActualitiesCards />)}
      <CUTLogosHome />
      {userOrganization && !userOrganization.onboarded && <Onboarding user={user} organization={userOrganization} />}
    </>
  )
}

export default UserView
