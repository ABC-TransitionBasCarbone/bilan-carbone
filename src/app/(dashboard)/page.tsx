import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import Footer from '@/environments/cut/layout/Footer'
import SimplifiedUserView from '@/environments/simplified/home/UserView'
import { Environment } from '@prisma/client'

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => (
  <>
    <Block>
      {(() => {
        switch (account.environment) {
          case Environment.TILT:
            return account.level ? <UserView account={account} /> : <SimplifiedUserView account={account} />
          case Environment.CUT:
          case Environment.CLICKSON:
            return <SimplifiedUserView account={account} />
          default:
            return <UserView account={account} />
        }
      })()}
    </Block>

    {account.environment === Environment.CUT && <Footer />}
  </>
)

export default withAuth(Home)
