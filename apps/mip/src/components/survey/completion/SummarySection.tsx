'use client'

import { CategoryWithActions } from '@/components/survey/completion/types'
import { formatMassKilograms, getCategoryToneSuffix } from '@abc-transitionbascarbone/publicodes/form'
import { ExpandMore } from '@mui/icons-material'
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from '../SurveyCompletion.module.css'

interface Props {
  actionsByCategory: CategoryWithActions[]
  totalKg: number
}

const SummarySection = ({ actionsByCategory, totalKg }: Props) => {
  const t = useTranslations('survey.completion')

  return (
    <section className="mb2" data-testid="survey-completion-summary">
      <Typography variant="h6" className={styles.sectionTitle}>
        {t('summary.title')}
      </Typography>

      <div className="flex-col gapped1">
        {actionsByCategory.map((category) => {
          const toneSuffix = getCategoryToneSuffix(category.key)
          const toneClass = styles[`tone${toneSuffix}`] ?? styles.toneDt
          const summaryToneClass = styles[`summaryAccordion${toneSuffix}`] ?? styles.summaryAccordionDt
          const categoryShare = totalKg > 0 ? Math.round((category.valueKg / totalKg) * 100) : 0

          return (
            <Accordion key={category.key} className={`${styles.summaryAccordion} ${summaryToneClass}`}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <div className={`${styles.summaryItem} gapped075`}>
                  <Typography className={styles.summaryIcon}>{category.icones}</Typography>
                  <Typography className={styles.summaryName}>{category.titre}</Typography>
                  <div className={styles.equalBarTrack}>
                    <div className={`${styles.equalBarFill} ${toneClass}`} />
                  </div>
                  <Typography className={styles.summaryValue}>{formatMassKilograms(category.valueKg)}</Typography>
                  <Typography className={styles.summaryPercent}>{categoryShare} %</Typography>
                </div>
              </AccordionSummary>

              <AccordionDetails>
                {category.actions.length > 0 && (
                  <div className="flex-col gapped075">
                    {category.actions.map((action) => (
                      <div key={action.key} className={styles.libraryActionRow}>
                        <Typography className={styles.actionIcon}>{action.icones}</Typography>
                        <Typography className={styles.actionTitle}>{action.titre}</Typography>
                        <Typography className={styles.actionImpact}>{formatMassKilograms(action.savingsKg)}</Typography>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionDetails>

              <AccordionActions>
                <Typography className={styles.subPostsLabel}>{t('summary.subPosts')}</Typography>
              </AccordionActions>
            </Accordion>
          )
        })}
      </div>
    </section>
  )
}

export default SummarySection
