import SurveyCompletion from '@/components/survey/SurveyCompletion'
import { getCampaignById } from '@/db/campaign'
import { RawRules } from '@/publicodes/mip-engine'
import { MipPublicodesProvider } from '@/publicodes/MipPublicodesProvider'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import { CampaignStatus } from '@abc-transitionbascarbone/db-common/enums'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

const SurveyEndPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const messages = await getMessages()

  const campaign = await getCampaignById(id)
  if (!campaign || campaign.status === CampaignStatus.CLOSED) {
    return <NotFound />
  }

  const model = campaign.modelCampaign?.model
  if (!model || typeof model !== 'object') {
    return <NotFound />
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <MipPublicodesProvider model={model as RawRules}>
        <SurveyCompletion surveyId={id} model={model as RawRules} restoreFromStorage />
      </MipPublicodesProvider>
    </NextIntlClientProvider>
  )
}

export default SurveyEndPage
