import { auth } from '@/services/auth'
import AdminPage from '@/components/pages/Admin'
import { canAccessAdmin } from '@/services/permissions/user'
import Block from '@/components/base/Block'

const Admin = async () => {
  const session = await auth()
  if (session && canAccessAdmin(session.user)) {
    return (
      <Block>
        <AdminPage user={session.user} />
      </Block>
    )
  }
}

export default Admin
