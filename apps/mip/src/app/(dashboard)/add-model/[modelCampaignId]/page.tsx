import ResetForm from '@/components/auth/ResetForm'
import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import { addOrganizationVersionMipIdToModelCampaign, getModelCampaignById } from '@/db/campaign'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

interface Props {
  params: Promise<{ modelCampaignId: string }>
}

const AddModelPage = async ({ user, params }: UserSessionProps & Props) => {
  const propsParams = await params

  const { modelCampaignId } = propsParams

  const modelCampaign = modelCampaignId ? (await getModelCampaignById(modelCampaignId)) : null
  if (!modelCampaign || modelCampaign.organizationVersionMip || !user.organizationVersionMipId) {
    return <NotFound />
  }

  console.log("user", user)

  await addOrganizationVersionMipIdToModelCampaign(modelCampaign.id, user.organizationVersionMipId)

  return <>add model page {modelCampaign.name} </>
}

export default withAuth(AddModelPage)
