import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { default as CUTUserView } from '@/environments/cut/home/UserView'
import Footer from '@/environments/cut/layout/Footer'
import { Environment } from '@prisma/client'

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => {
  return (
    <>
      <Block>
        <DynamicComponent
          defaultComponent={<UserView account={account} />}
          environmentComponents={{ [Environment.CUT]: <CUTUserView /> }}
        />
      </Block>
      {account.environment === Environment.CUT && <Footer />}
    </>
  )
}

export default withAuth(Home)
