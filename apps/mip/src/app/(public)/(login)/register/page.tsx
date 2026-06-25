import SignUpForm from '@/components/auth/SignUpForm'
import { getModelCampaignById } from '@/db/campaign'
import { auth } from '@/services/auth'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const SignUpPage = async (props: Props) => {
  const session = await auth()
  if (session) {
    redirect('/')
  }

  const searchParams = await props.searchParams
  const modelCampaignId = searchParams['modelId'] as string

  const modelCampaign = modelCampaignId ? await getModelCampaignById(modelCampaignId) : null
  if (!modelCampaign || modelCampaign.organizationVersionMip) {
    return <NotFound />
  }
  return <SignUpForm modelCampaignId={modelCampaignId} />
}

export default SignUpPage
