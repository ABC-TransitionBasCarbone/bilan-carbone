import Block from '@/components/base/Block'
import AdminPage from '@/components/pages/Admin'
import { auth } from '@/services/auth'
import { canAccessAdmin } from '@/services/permissions/user'

const Admin = async () => {
  const session = await auth()
  if (session && canAccessAdmin(session.user)) {
    return (
      <Block>
        <AdminPage />
      </Block>
    )
  }
}

export default Admin
