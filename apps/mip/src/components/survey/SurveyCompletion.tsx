'use client'

import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import model from '@/publicodes/publicodes-mip.model.json'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { ExpandMore, Refresh } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import styles from './SurveyCompletion.module.css'

type ModelRule = {
  titre?: string
  icônes?: string
  somme?: Array<string | number>
}
type RawModel = Record<string, ModelRule | { somme?: Array<string | number> } | null>

const modelRules = model as RawModel

const CATEGORY_KEYS = ['DT', 'transport', 'alimentation', 'divers', 'logement'] as const

const TARGET_2050_KG = 2000

interface CategoryResult {
  key: string
  titre: string
  icônes: string
  valueKg: number
}

interface ActionResult {
  key: string
  titre: string
  icônes: string
  categoryKey: string
  savingsKg: number
}

interface Props {
  onRestart: () => void
  surveyId: string
}

const SurveyCompletion = ({ onRestart, surveyId }: Props) => {
  const t = useTranslations('survey.completion')
  const { engine } = useMipPublicodes()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const totalEval = engine.evaluate('bilan')
  const totalKg = typeof totalEval.nodeValue === 'number' ? Math.max(0, totalEval.nodeValue) : 0

  const categories: CategoryResult[] = CATEGORY_KEYS.map((key) => {
    const result = engine.evaluate(key)
    const valueKg = typeof result.nodeValue === 'number' ? Math.max(0, result.nodeValue) : 0
    const rule = modelRules[key] as ModelRule | undefined
    return {
      key,
      titre: rule?.titre ?? key,
      icônes: rule?.icônes ?? '',
      valueKg,
    }
  }).sort((a, b) => b.valueKg - a.valueKg)

  const actionsRule = modelRules['actions'] as { somme?: Array<string | number> } | null | undefined
  const actionKeys = (actionsRule?.somme ?? []).filter((value): value is string => typeof value === 'string')

  const actions: ActionResult[] = actionKeys
    .flatMap((key) => {
      try {
        const result = engine.evaluate(key)
        const savingsKg = typeof result.nodeValue === 'number' ? Math.max(0, result.nodeValue) : 0
        const rule = modelRules[key] as ModelRule | undefined
        return [
          {
            key,
            titre: rule?.titre ?? key,
            icônes: rule?.icônes ?? '',
            categoryKey: key.split(' . ')[0],
            savingsKg,
          },
        ]
      } catch {
        return []
      }
    })
    .filter((a) => a.savingsKg > 0)
    .sort((a, b) => b.savingsKg - a.savingsKg)

  const targetBarValue = Math.min(100, (totalKg / TARGET_2050_KG) * 100)
  const topCategories = categories.slice(0, 3)

  return (
    <div className={styles.scrollWrapper}>
      <Container maxWidth="md" className={styles.page}>
        <section className={styles.hero} data-testid="survey-completion-hero">
        <Typography variant="h4" className={styles.heroTitle}>
          {t('title')}
        </Typography>
        <div className={styles.footprintDisplay}>
          <Typography className={styles.footprintValue}>{formatNumber(Math.round(totalKg))}</Typography>
          <Typography className={styles.footprintUnit}>{t('unit')}</Typography>
        </div>
        <div className={styles.targetBar}>
          <LinearProgress variant="determinate" value={targetBarValue} />
          <div className={styles.targetBarLabels}>
            <Typography className={styles.targetBarLabel}>0</Typography>
            <Typography className={styles.targetBarLabel}>{t('target')}</Typography>
          </div>
        </div>
        </section>

        <section className={styles.section} data-testid="survey-completion-top-categories">
          <Typography variant="h6" className={styles.sectionTitle}>
            {t('topCategories.title')}
          </Typography>
          <div className={styles.topCategoriesList}>
            {topCategories.map((cat, index) => (
              <div key={cat.key} className={styles.topCategoryItem}>
                <Typography className={styles.topCategoryRank}>{index + 1}</Typography>
                <Typography className={styles.topCategoryIcon}>{cat.icônes}</Typography>
                <Typography className={styles.topCategoryName}>{cat.titre}</Typography>
                <Typography className={styles.topCategoryValue}>
                  {formatNumber(Math.round(cat.valueKg))} {t('kgUnit')}
                </Typography>
              </div>
            ))}
          </div>
        </section>

        {topCategories.map((cat, index) => {
          const catActions = actions.filter((a) => a.categoryKey === cat.key).slice(0, 5)
          if (catActions.length === 0) {
            return null
          }
          const catPercent = totalKg > 0 ? Math.round((cat.valueKg / totalKg) * 100) : 0

          return (
            <section key={cat.key} className={styles.section} data-testid={`category-actions-${cat.key}`}>
              <div className={styles.categoryHeader}>
                <Typography className={styles.categoryRankBadge}>{index + 1}</Typography>
                <Typography variant="h6">{cat.titre}</Typography>
                <Typography className={styles.categoryPercent}>
                  {catPercent} % {t('ofFootprint')}
                </Typography>
              </div>
              <div className={styles.actionsList}>
                {catActions.map((action) => {
                  const actionPercent = totalKg > 0 ? Math.round((action.savingsKg / totalKg) * 100) : 0
                  return (
                    <Card key={action.key} className={styles.actionCard}>
                      <CardContent className={styles.actionContent}>
                        <Typography className={styles.actionIcon}>{action.icônes}</Typography>
                        <div className={styles.actionDetails}>
                          <Typography className={styles.actionTitle}>{action.titre}</Typography>
                          {actionPercent > 0 && (
                            <Typography className={styles.actionImpact}>
                              {actionPercent} % {t('ofFootprint')}
                            </Typography>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )
        })}

        <section className={styles.section} data-testid="survey-completion-summary">
          <Typography variant="h6" className={styles.sectionTitle}>
            {t('summary.title')}
          </Typography>
          <div className={styles.summaryList}>
            {categories.map((cat) => {
              const catPercent = totalKg > 0 ? Math.min(100, (cat.valueKg / totalKg) * 100) : 0
              return (
                <div key={cat.key} className={styles.summaryItem}>
                  <Typography className={styles.summaryIcon}>{cat.icônes}</Typography>
                  <Typography className={styles.summaryName}>{cat.titre}</Typography>
                  <div className={styles.summaryBar}>
                    <LinearProgress variant="determinate" value={catPercent} />
                  </div>
                  <Typography className={styles.summaryValue}>
                    {formatNumber(Math.round(cat.valueKg))} {t('kgUnit')}
                  </Typography>
                </div>
              )
            })}
          </div>
        </section>

        <section className={styles.faqSection} data-testid="survey-completion-faq">
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

        <div className={styles.footerActions}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={onRestart}>
            {t('restart')}
          </Button>
          <Button component={Link} href={`/survey/${surveyId}/results`} variant="contained">
            {t('adminResults')}
          </Button>
        </div>
      </Container>
    </div>
  )
}

export default SurveyCompletion
