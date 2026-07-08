'use server'

import SurveyCompletion from '@/components/survey/SurveyCompletion'
import { getCampaignById } from '@/db/campaign'
import { RawRules } from '@/publicodes/mip-engine'
import { MipPublicodesProvider } from '@/publicodes/MipPublicodesProvider'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { CampaignStatus } from '@abc-transitionbascarbone/db-common/enums'

const SurveyEndPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  const campaign = await getCampaignById(id)
  if (!campaign || campaign.status === CampaignStatus.CLOSED) {
    return <NotFound />
  }

  return (
    <MipPublicodesProvider model={campaign.modelCampaign.model as RawRules}>
      <SurveyCompletion surveyId={id} model={campaign.modelCampaign.model as RawRules} restoreFromStorage />
    </MipPublicodesProvider>
  )
}

export default SurveyEndPage
