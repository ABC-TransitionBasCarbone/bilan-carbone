import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { Environment } from '@prisma/client'
import dynamic from 'next/dynamic'

const UserView = dynamic(() => import('@/components/home/UserView'))
const SimplifiedUserView = dynamic(() => import('@/environments/simplified/home/UserView'))
const ClicksonUserView = dynamic(() => import('@/environments/clickson/home/UserView'))
const FooterCut = dynamic(() => import('@/environments/cut/layout/Footer'))
const FooterClickson = dynamic(() => import('@/environments/clickson/layout/Footer'))

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => (
  <>
    <Block>
      <DynamicComponent
        environmentComponents={{
          [Environment.TILT]: account.level ? <UserView account={account} /> : <SimplifiedUserView account={account} />,
          [Environment.CUT]: <SimplifiedUserView account={account} />,
          [Environment.CLICKSON]: <ClicksonUserView account={account} />,
        }}
        defaultComponent={<UserView account={account} />}
        forceEnvironment={account.environment}
      />
    </Block>
    <DynamicComponent
      environmentComponents={{
        [Environment.CUT]: <FooterCut />,
        [Environment.CLICKSON]: <FooterClickson />,
      }}
    />
  </>
)

export default withAuth(Home)
