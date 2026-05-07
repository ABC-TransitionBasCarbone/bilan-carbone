import { Question } from '@abc-transitionbascarbone/typeguards'
import { Typography } from '@mui/material'
import { ChoiceQuestionInput } from './ChoiceQuestionInput'
import { NumberQuestionInput } from './NumberQuestionInput'
import styles from './QuestionRenderer.module.css'
import { TextQuestionInput } from './TextQuestionInput'

interface QuestionRendererProps {
  question: Question
  value: string | string[] | number | undefined
  onChange: (value: string | string[] | number) => void
  error?: string | null
}

export function QuestionRenderer({ question, value, onChange, error }: QuestionRendererProps) {
  return (
    <div>
      <Typography variant="h5" gutterBottom>
        {question.title}
        {question.required && (
          <Typography component="span" className={styles.required}>
            *
          </Typography>
        )}
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
          value={typeof value === 'string' ? value : undefined}
          onChange={onChange}
          error={error}
        />
      )}

      {question.type === 'number' && (
        <NumberQuestionInput
          question={question}
          value={typeof value === 'number' ? value : 0}
          onChange={onChange}
          error={error}
        />
      )}
    </div>
  )
}
