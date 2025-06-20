import { Question } from '@/environments/cut/services/post'
import { Checkbox, FormControlLabel, styled, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface Props {
  question: Question
}

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.palette.grey[500]}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))

export const QCM = ({ question }: Props) => {
  const tCutQuestions = useTranslations('cutQuestions')
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  return (
    <div className="flex flex-col m2">
      <Typography className="mb2">{tCutQuestions(question.key)}</Typography>
      {question.options?.map((option, index) => (
        <StyledFormControlLabel
          key={`box-${index}`}
          className="p-2 pr1 flex flex-row align-center mb1"
          control={
            <Checkbox
              key={index}
              name={option}
              checked={selectedOptions.includes(option)}
              onChange={(e) => {
                setSelectedOptions((oldValues) => {
                  const newValues = e.target.checked ? [...oldValues, option] : oldValues.filter((c) => c !== option)
                  return newValues
                })
              }}
            />
          }
          label={tCutQuestions(`qcm.${option}`)}
        />
      ))}
    </div>
  )
}
