import ResultsDashboard from '@/components/results/ResultsDashboard'
import { sampleResults } from '@/data/sampleResults'
import { Container } from '@mui/material'

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const results = id === sampleResults.surveyId ? sampleResults : { ...sampleResults, surveyId: id }
  return (
    <Container maxWidth="md">
      <ResultsDashboard results={results} />
    </Container>
  )
}
