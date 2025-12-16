import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import { EnvironmentMode } from '@/constants/environments'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import Footer from '@/environments/cut/layout/Footer'
import SimplifiedUserView from '@/environments/simplified/home/UserView'
import { Environment } from '@prisma/client'

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => (
  <>
    <Block>
      <DynamicComponent
        environmentComponents={{
          [Environment.TILT]: account.level ? <UserView account={account} /> : <SimplifiedUserView account={account} />,
          [EnvironmentMode.SIMPLIFIED]: <SimplifiedUserView account={account} />,
        }}
        defaultComponent={<UserView account={account} />}
        forceEnvironment={account.environment}
      />
    </Block>

    {account.environment === Environment.CUT && <Footer />}
  </>
)

export default withAuth(Home)
