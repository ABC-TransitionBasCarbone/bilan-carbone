'use server'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import SuperAdminPage from '@/components/pages/SuperAdmin'
import { getAllModelCampaigns } from '@/db/campaign'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { RoleMip } from '@abc-transitionbascarbone/db-common/enums'

const SuperAdmin = async ({ user }: UserSessionProps) => {
  if (user?.role !== RoleMip.SUPER_ADMIN) {
    return <NotFound />
  }
  const allModelCampaigns = await getAllModelCampaigns()
  return <SuperAdminPage modelCampaigns={allModelCampaigns} />
}

export default withAuth(SuperAdmin)
