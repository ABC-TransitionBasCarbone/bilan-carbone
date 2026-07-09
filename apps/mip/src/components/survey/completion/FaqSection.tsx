'use client'

import { ExpandMore } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

const FaqSection = () => {
  const t = useTranslations('survey.completion')

  return (
    <section className="mb2" data-testid="survey-completion-faq">
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>{t('faq.alone.question')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{t('faq.alone.answer')}</Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>{t('faq.start.question')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>{t('faq.start.answer')}</Typography>
        </AccordionDetails>
      </Accordion>
    </section>
  )
}

export default FaqSection
