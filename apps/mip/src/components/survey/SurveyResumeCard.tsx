import { Button, Container, Typography } from '@mui/material'

interface Props {
  title: string
  restartLabel: string
  continueLabel: string
  onRestart: () => void
  onContinue: () => void
}

const SurveyResumeCard = ({ title, restartLabel, continueLabel, onRestart, onContinue }: Props) => {
  return (
    <Container maxWidth="md">
      <Typography variant="h4">{title}</Typography>
      <div>
        <Button variant="outlined" onClick={onRestart}>
          {restartLabel}
        </Button>
        <Button variant="contained" onClick={onContinue}>
          {continueLabel}
        </Button>
      </div>
    </Container>
  )
}

export default SurveyResumeCard
