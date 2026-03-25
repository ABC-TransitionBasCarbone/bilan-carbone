import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import Onboarding from '@/components/onboarding/Onboarding'
import { environmentWithOnboarding } from '@/constants/environments'
import { getOrganizationVersionById } from '@/db/organization'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { Environment } from '@prisma/client'
import dynamic from 'next/dynamic'

const ClicksonUserView = dynamic(() => import('@/environments/clickson/home/UserView'))
const FooterClickson = dynamic(() => import('@/environments/clickson/layout/Footer'))
const FooterCut = dynamic(() => import('@/environments/cut/layout/Footer'))
const SimplifiedUserView = dynamic(() => import('@/environments/simplified/home/UserView'))

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
