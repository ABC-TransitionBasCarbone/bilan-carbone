import ResultsDashboard from '@/components/results/ResultsDashboard'
import { getCampaignById, getCampaignResponses } from '@/db/campaign'
import { RawRules } from '@/publicodes/mip-engine'
import { buildCampaignResults } from '@/services/results/buildCampaignResults'
import styles from './ResultsPage.module.css'

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await getCampaignById(id)
  const model = (campaign?.modelCampaign?.model ?? {}) as RawRules
  const responses = await getCampaignResponses(id)
  const results = buildCampaignResults({ surveyId: id, model, responses })

  return (
    <div className={styles.scrollWrapper}>
      <main className="main-container">
        <ResultsDashboard results={results} model={model} />
      </main>
    </div>
  )
}
