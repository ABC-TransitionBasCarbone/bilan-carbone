'use server'

import withAuth from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import SuperAdminPage from '@/components/pages/SuperAdmin'
import { auth } from '@/services/auth'
import { Role } from '@prisma/client'

const SuperAdmin = async () => {
  const session = await auth()
  if (session?.user?.role !== Role.SUPER_ADMIN) {
    return <NotFound />
  }
  return <SuperAdminPage />
}

export default withAuth(SuperAdmin)
