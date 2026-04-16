/**
 * Survey Page Component
 * Main component for displaying and managing survey questions
 */

'use client'

import { useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Typography,
  Alert,
} from '@mui/material'
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { SurveyEngine, Survey } from '@repo/survey'
import { useSurveyStore } from '@/store/surveyStore'
import { QuestionRenderer } from './QuestionRenderer'

interface SurveyPageProps {
  survey: Survey
  responseId?: string
}

export function SurveyPage({ survey, responseId }: SurveyPageProps) {
  const {
    survey: loadedSurvey,
    response,
    currentQuestionIndex,
    error,
    loadSurvey,
    setAnswer,
    goToNext,
    goToPrevious,
  } = useSurveyStore()

  // Load survey on mount
  useEffect(() => {
    loadSurvey(survey, responseId)
  }, [survey, responseId, loadSurvey])

  const engine = useMemo(() => {
    if (!loadedSurvey || !response) return null
    return new SurveyEngine(loadedSurvey, response)
  }, [loadedSurvey, response])

  if (!engine || !response) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading survey...</Typography>
      </Container>
    )
  }

  const currentQuestion = engine.getCurrentQuestion()
  const progress = engine.getProgress()
  const isComplete = engine.isComplete()

  if (isComplete) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Check sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Survey Completed!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Thank you for completing the survey.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Response ID: {response.responseId}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    )
  }

  if (!currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">No question found</Alert>
      </Container>
    )
  }

  const currentAnswer = engine.getAnswer(currentQuestion.id)

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={3}>
        <Typography variant="h3" gutterBottom>
          {survey.title}
        </Typography>
        {survey.description && (
          <Typography variant="body1" color="text.secondary">
            {survey.description}
          </Typography>
        )}
      </Box>

      {/* Progress Bar */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} of {survey.questions.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {progress}% Complete
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Question Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <QuestionRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={(value) => setAnswer(currentQuestion.id, value)}
            error={error}
          />
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={goToPrevious}
          disabled={!engine.hasPreviousQuestion()}
        >
          Previous
        </Button>

        {engine.hasNextQuestion() ? (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={goToNext}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            endIcon={<Check />}
            onClick={goToNext}
          >
            Complete
          </Button>
        )}
      </Box>

      {/* Response ID */}
      <Box mt={4} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          Response ID: {response.responseId}
        </Typography>
      </Box>
    </Container>
  )
}
