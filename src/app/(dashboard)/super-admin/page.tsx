import withAuth, { UserProps } from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import SuperAdminPage from '@/components/pages/SuperAdmin'
import { Role } from '@prisma/client'

const SuperAdmin = async ({ user }: UserProps) => {
  if (user.role !== Role.SUPER_ADMIN) {
    return <NotFound />
  }

  return <SuperAdminPage />
}

export default withAuth(SuperAdmin)
