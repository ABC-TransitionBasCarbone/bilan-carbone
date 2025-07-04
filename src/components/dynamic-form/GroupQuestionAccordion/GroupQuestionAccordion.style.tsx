'use client'
import { FieldSaveStatus } from '@/hooks/useAutoSave'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { Accordion, AccordionDetails, AccordionSummary, AccordionSummaryProps, Box, styled } from '@mui/material'

export const StyledQuestionAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  marginBottom: '2rem',
  borderRadius: '0.5rem',
  border: `1px solid ${theme.palette.divider}`,
}))

export const StyledQuestionAccordionSummary = styled(
  ({ saveStatus, ...props }: AccordionSummaryProps & { saveStatus: FieldSaveStatus | undefined }) => (
    <AccordionSummary {...props}>
      {props.title}
      {saveStatus && (
        <Box ml="auto" mr={1}>
          <CheckCircleIcon color="primary" />
        </Box>
      )}
    </AccordionSummary>
  ),
)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  borderRadius: '0.5rem 0.5rem 0 0',
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '1rem',
  margin: 0,
}))

export const StyledQuestionAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: 0,
}))
