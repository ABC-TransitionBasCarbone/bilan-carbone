import Block from '@/components/base/Block'
import withAuth, { UserProps } from '@/components/hoc/withAuth'
import UserView from '@/components/home/UserView'

export const revalidate = 0

const Home = async (props: UserProps) => {
  return (
    <>
      <Block>
        <UserView user={props.user} />
      </Block>
    </>
  )
}

export default withAuth(Home)
