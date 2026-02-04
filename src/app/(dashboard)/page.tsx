import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import { default as ClicksonUserView } from '@/environments/clickson/home/UserView'
import FooterClickson from '@/environments/clickson/layout/Footer'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
import FooterCut from '@/environments/cut/layout/Footer'
import SimplifiedUserView from '@/environments/simplified/home/UserView'
import { Environment } from '@prisma/client'

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
