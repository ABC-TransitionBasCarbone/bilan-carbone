import AdminPage from '@/components/pages/Admin'
import NotFound from '@/components/pages/NotFound'
import { auth } from '@/services/auth'
import { Role } from '@prisma/client'

const Admin = async () => {
  const session = await auth()
  if (!session || session.user.role !== Role.SUPER_ADMIN) {
    return <NotFound />
  }

  return <AdminPage />
}

export default Admin
