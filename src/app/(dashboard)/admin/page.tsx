import withAuth, { UserProps } from '@/components/hoc/withAuth'
import AdminPage from '@/components/pages/Admin'
import NotFound from '@/components/pages/NotFound'
import { Role } from '@prisma/client'

const Admin = async ({ user }: UserProps) => {
  if (user.role !== Role.SUPER_ADMIN) {
    return <NotFound />
  }

  return <AdminPage />
}

export default withAuth(Admin)
