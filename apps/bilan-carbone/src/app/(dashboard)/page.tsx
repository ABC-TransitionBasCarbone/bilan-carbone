import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import Onboarding from '@/components/onboarding/Onboarding'
import { environmentWithOnboarding } from '@/constants/environments'
import { getOrganizationVersionById } from '@/db/organization'
import { default as ClicksonUserView } from '@/environments/clickson/home/UserView'
import FooterClickson from '@/environments/clickson/layout/Footer'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import FooterCut from '@/environments/cut/layout/Footer'
import SimplifiedUserView from '@/environments/simplified/home/UserView'
import { Environment } from '@prisma/client'

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => {
  const userOrganizationVersion = await getOrganizationVersionById(account.organizationVersionId)

  const showOnboarding =
    userOrganizationVersion &&
    !userOrganizationVersion.onboarded &&
    environmentWithOnboarding.includes(userOrganizationVersion.environment)

  return (
    <>
      <Block>
        <DynamicComponent
          environmentComponents={{
            [Environment.TILT]: account.level ? (
              <UserView account={account} />
            ) : (
              <SimplifiedUserView account={account} />
            ),
            [Environment.CUT]: <SimplifiedUserView account={account} />,
            [Environment.CLICKSON]: <ClicksonUserView account={account} />,
          }}
          defaultComponent={<UserView account={account} />}
          forceEnvironment={account.environment}
        />
        {showOnboarding && <Onboarding user={account} organizationVersion={userOrganizationVersion!} />}
      </Block>
      <DynamicComponent
        environmentComponents={{
          [Environment.CUT]: <FooterCut />,
          [Environment.CLICKSON]: <FooterClickson />,
        }}
      />
    </>
  )
}

export default withAuth(Home)
