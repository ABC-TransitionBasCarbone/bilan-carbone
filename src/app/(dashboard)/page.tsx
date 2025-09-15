import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import { default as CUTUserView } from '@/environments/cut/home/UserView'
import Footer from '@/environments/cut/layout/Footer'
import { Environment } from '@prisma/client'
import { redirect } from 'next/navigation'

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => {
  if (account.environment === Environment.TILT && !account.level) {
    redirect('/equipe')
  }

  return (
    <>
      {account.environment === Environment.CUT ? (
        <CUTUserView account={account} />
      ) : (
        <Block>
          <UserView account={account} />
        </Block>
      )}

      {account.environment === Environment.CUT && <Footer />}
    </>
  )
}

export default withAuth(Home)
