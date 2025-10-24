'use server'

import withAuth from '@/components/hoc/withAuth'
import NotFound from '@/components/pages/NotFound'
import SuperAdminPage from '@/components/pages/SuperAdmin'
import { getAccounts } from '@/db/account'
import { auth } from '@/services/auth'
import { Role } from '@prisma/client'

const SuperAdmin = async () => {
  const session = await auth()
  if (session?.user?.role !== Role.SUPER_ADMIN) {
    return <NotFound />
  }

  const accounts = await getAccounts()

  return <SuperAdminPage environment={session.user.environment} accounts={accounts} />
}

export default withAuth(SuperAdmin)
