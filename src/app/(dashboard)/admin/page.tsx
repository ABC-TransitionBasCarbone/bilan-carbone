import AdminPage from '@/components/pages/Admin'
import { auth } from '@/services/auth'
import { Role } from '@prisma/client'
import { redirect } from 'next/navigation'

const Admin = async () => {
  const session = await auth()
  if (!session || session.user.role !== Role.SUPER_ADMIN) {
    return redirect('/')
  }

  return <AdminPage />
}

export default Admin
