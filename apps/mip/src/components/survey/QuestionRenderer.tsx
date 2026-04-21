/**
 * Question Renderer Component
 * Renders different question types based on the question configuration
 */

import { Typography } from '@mui/material'
import { Question } from '@repo/survey'
import { TextQuestionInput } from './TextQuestionInput'
import { ChoiceQuestionInput } from './ChoiceQuestionInput'

interface QuestionRendererProps {
  question: Question
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
  error?: string | null
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  error,
}: QuestionRendererProps) {
  return (
    <div>
      <Typography variant="h5" gutterBottom>
        {question.title}
        {question.required && <Typography component="span" sx={{ color: 'error.main' }}> *</Typography>}
      </Typography>

      {question.description && (
        <Typography variant="body2" color="text.secondary" paragraph>
          {question.description}
        </Typography>
      )}

      {question.type === 'text' && (
        <TextQuestionInput
          question={question}
          value={typeof value === 'string' ? value : ''}
          onChange={onChange}
          error={error}
        />
      )}

      {question.type === 'choice' && (
        <ChoiceQuestionInput
          question={question}
          value={value}
          onChange={onChange}
          error={error}
        />
      )}
    </div>
  )
}
