'use client'
import { Accordion, AccordionDetails, AccordionSummary, styled } from '@mui/material'

export const StyledQuestionAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}))

export const StyledQuestionAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
}))

export const StyledQuestionAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}))
