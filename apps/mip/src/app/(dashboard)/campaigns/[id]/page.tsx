import ResultsDashboard from '@/components/results/ResultsDashboard'
import { getSurveyResults } from '@/services/serverFunctions/survey'
import NotFound from '@abc-transitionbascarbone/components/src/pages/NotFound'

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const results = await getSurveyResults(id)
  if (!results) {
    return <NotFound />
  }

  return (
    <div className="h100 overflow-y-auto grow">
      <main className="main-container">
        <ResultsDashboard results={results} />
      </main>
    </div>
  )
}
