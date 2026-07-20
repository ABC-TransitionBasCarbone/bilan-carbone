'use client'

import { ExpandMore } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

const FaqSection = () => {
  const t = useTranslations('survey.completion')
  const faqItems = [
    {
      questionKey: 'faq.alone.question',
      answerKey: 'faq.alone.answer',
    },
    {
      questionKey: 'faq.start.question',
      answerKey: 'faq.start.answer',
    },
  ]

  return (
    <section className="mb2" data-testid="survey-completion-faq">
      {faqItems.map(({ questionKey, answerKey }) => (
        <Accordion key={questionKey}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>{t(questionKey)}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>{t(answerKey)}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </section>
  )
}

export default FaqSection
