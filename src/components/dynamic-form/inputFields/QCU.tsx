import { Question } from '@/environments/cut/services/post'
import { Box, Radio, styled, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

interface Props {
  question: Question
}

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  border: `solid 1px ${theme.palette.grey[500]}`,
  borderRadius: '1rem',
  width: 'fit-content',
}))

export const QCU = ({ question }: Props) => {
  const tCutQuestions = useTranslations('cutQuestions')
  const [selectedOption, setSelectedOption] = useState<string | null>()

  return (
    <div className="flex flex-col m2">
      <Typography className="mb2">{tCutQuestions(question.key)}</Typography>
      {[tCutQuestions('qcu.yes'), tCutQuestions('qcu.no')].map((option, index) => (
        <StyledBox key={`box-${index}`} className="p-2 pr1 flex flex-row align-center mb1">
          <Radio
            key={index}
            name={option}
            checked={selectedOption === option}
            onChange={(e) => setSelectedOption(e.target.checked ? option : null)}
          />
          <Typography>{tCutQuestions(`qcu.${option}`)}</Typography>
        </StyledBox>
      ))}
    </div>
  )
}
