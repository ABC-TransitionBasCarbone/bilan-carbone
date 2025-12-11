import Block from '@/components/base/Block'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'
import Footer from '@/environments/cut/layout/Footer'
import SimplifiedUserView from '@/environments/simplified/home/UserView'
import { Environment } from '@prisma/client'
import { redirect } from 'next/navigation'

export const revalidate = 0

const Home = async ({ user: account }: UserSessionProps) => {
  if (account.environment === Environment.TILT && !account.level) {
    redirect('/equipe')
  }

  return (
    <>
      <Block>
        {(() => {
          switch (account.environment) {
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
}

export default withAuth(Home)
