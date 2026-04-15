/**
 * Question Renderer Component
 * Renders different question types based on the question configuration
 */

'use client'

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import { ChoiceQuestion, Question, TextQuestion } from '@/lib/survey/types'

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
        {question.required && <span style={{ color: 'red' }}> *</span>}
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

// Text Question Input Component
function TextQuestionInput({
  question,
  value,
  onChange,
  error,
}: {
  question: TextQuestion
  value: string
  onChange: (value: string) => void
  error?: string | null
}) {
  return (
    <FormControl fullWidth error={!!error}>
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder={question.placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error}
        inputProps={{
          maxLength: question.validation?.maxLength,
        }}
      />
      {question.validation?.maxLength && (
        <FormHelperText>
          {value?.length || 0} / {question.validation.maxLength} characters
        </FormHelperText>
      )}
    </FormControl>
  )
}

// Choice Question Input Component
function ChoiceQuestionInput({
  question,
  value,
  onChange,
  error,
}: {
  question: ChoiceQuestion
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
  error?: string | null
}) {
  const selectedValue = typeof value === 'string' ? value : value?.[0] || ''

  return (
    <FormControl fullWidth error={!!error}>
      <RadioGroup
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {question.options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}
