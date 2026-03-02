import Onboarding from '@/components/onboarding/Onboarding'
import StudiesContainer from '@/components/study/StudiesContainer'
import { environmentWithOnboarding } from '@/constants/environments'
import { getAccountOrganizationVersions } from '@/db/account'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { default as SimplifiedUserView } from '@/environments/simplified/home/UserView'
import { UserSession } from 'next-auth'

interface Props {
  account: UserSession
}

const UserView = async ({ account }: Props) => {
  if (!account.organizationVersionId) {
    return <StudiesContainer user={account} />
  }

  const organizationVersions = await getAccountOrganizationVersions(account.accountId)
  const userOrganizationVersion = organizationVersions.find(
    (organizationVersion) => organizationVersion.id === account.organizationVersionId,
  ) as OrganizationVersionWithOrganization

  return (
    <>
      <SimplifiedUserView account={account} />
      {userOrganizationVersion &&
        !userOrganizationVersion.onboarded &&
        environmentWithOnboarding.includes(userOrganizationVersion.environment) && (
          <Onboarding user={account} organizationVersion={userOrganizationVersion} />
        )}
    </>
  )
}

export default UserView
