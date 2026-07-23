import ResultsDashboard from '@/components/results/ResultsDashboard'
import { getSurveyResults } from '@/services/serverFunctions/survey'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'
import styles from '../../../../components/pages/ResultsPage.module.css'

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const results = await getSurveyResults(id)
  if (!results) {
    return <NotFound />
  }

  return (
    <div className={styles.scrollWrapper}>
      <main className="main-container">
        <ResultsDashboard results={results} />
      </main>
    </div>
  )
}
