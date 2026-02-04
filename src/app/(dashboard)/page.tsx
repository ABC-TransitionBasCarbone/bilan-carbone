import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
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
          [Environment.TILT]: account.level
            ? typeDynamicComponent({ component: UserView, props: { account } })
            : typeDynamicComponent({ component: SimplifiedUserView, props: { account } }),
          [Environment.CUT]: typeDynamicComponent({ component: SimplifiedUserView, props: { account } }),
          [Environment.CLICKSON]: typeDynamicComponent({
            component: ClicksonUserView,
            props: { account },
          }),
        }}
        defaultComponent={typeDynamicComponent({ component: UserView, props: { account } })}
        environment={account.environment}
      />
    </Block>
    <DynamicComponent
      environmentComponents={{
        [Environment.CUT]: typeDynamicComponent({ component: FooterCut, props: {} }),
        [Environment.CLICKSON]: typeDynamicComponent({ component: FooterClickson, props: {} }),
      }}
      environment={account.environment}
    />
  </>
)

export default withAuth(Home)
