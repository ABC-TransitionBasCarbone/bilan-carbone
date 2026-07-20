'use server'
import SurveyClient from '@/components/survey/SurveyClient'
import { getCampaignById } from '@/db/campaign'
import { RawRules } from '@/publicodes/mip-engine'
import { MipPublicodesProvider } from '@/publicodes/MipPublicodesProvider'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { CampaignStatus } from '@abc-transitionbascarbone/db-common/enums'

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const campaign = await getCampaignById(id)
  if (!campaign || campaign.status === CampaignStatus.CLOSED) {
    return <NotFound />
  }

  return (
    <MipPublicodesProvider model={campaign.modelCampaign.model as RawRules}>
      <SurveyClient surveyId={id} />
    </MipPublicodesProvider>
  )
}
