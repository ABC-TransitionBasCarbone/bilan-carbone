import { Box } from '@mui/material'
import {
  StyledQuestionContainer,
  StyledQuestionContent,
  StyledQuestionHeader,
  StyledQuestionTitle,
} from './QuestionContainer.styles'

export interface QuestionContainerProps {
  label: string
  children: React.ReactNode
}

const QuestionContainer = ({ label, children }: QuestionContainerProps) => {
  return (
    <StyledQuestionContainer>
      <StyledQuestionHeader>
        <Box className="align-center gapped1">
          <StyledQuestionTitle>{label}</StyledQuestionTitle>
        </Box>
      </StyledQuestionHeader>

      <StyledQuestionContent>{children}</StyledQuestionContent>
    </StyledQuestionContainer>
  )
}

export { QuestionContainer }
