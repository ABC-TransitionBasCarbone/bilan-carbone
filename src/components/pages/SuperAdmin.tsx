'use server'

import NotFound from '@/components/pages/NotFound'
import { auth } from '@/services/auth'
import { Role } from '@prisma/client'
import Admin from '../admin/SuperAdmin'

const SuperAdminPage = async () => {
  const session = await auth()
  const user = session?.user

  if (user?.role !== Role.SUPER_ADMIN) {
    return <NotFound />
  }

  return <Admin />
}

export default SuperAdminPage
