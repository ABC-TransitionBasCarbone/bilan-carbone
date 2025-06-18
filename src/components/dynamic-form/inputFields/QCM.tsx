import { Question } from '@/environments/cut/services/post'
import { Box, Checkbox, styled, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './QCM.module.css'

interface Props {
  question: Question
}

const StyledBox = styled(Box)(({ theme }) => ({
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
        <StyledBox
          key={`box-${index}`}
          className={classNames(styles.qcmContainer, 'p-2 pr1 flex flex-row align-center mb1')}
        >
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
          <Typography>{tCutQuestions(`qcm.${option}`)}</Typography>
        </StyledBox>
      ))}
    </div>
  )
}
