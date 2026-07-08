import ResultsDashboard from '@/components/results/ResultsDashboard'
import { sampleResults } from '@/data/sampleResults'
import { getCampaignById } from '@/db/campaign'
import { RawRules } from '@/publicodes/mip-engine'
import styles from './ResultsPage.module.css'

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaign = await getCampaignById(id)
  const model = (campaign?.modelCampaign?.model ?? {}) as RawRules
  const results = id === sampleResults.surveyId ? sampleResults : { ...sampleResults, surveyId: id }
  return (
    <div className={styles.scrollWrapper}>
      <main className="main-container">
        <ResultsDashboard results={results} model={model} />
      </main>
    </div>
  )
}
