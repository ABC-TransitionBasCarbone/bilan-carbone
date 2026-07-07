'use client'

import CollectiveEffortEncart from '@/components/results/CollectiveEffortEncart'
import { clearSurveyState, loadSurveyState } from '@/components/survey/surveyStateStorage'
import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import type { RawRules } from '@/publicodes/mip-engine'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { ExpandMore, Refresh } from '@mui/icons-material'
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  Container,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Situation } from 'publicodes'
import { useEffect, useMemo, useState } from 'react'
import styles from './SurveyCompletion.module.css'

type ModelRule = {
  titre?: string
  icônes?: string
  somme?: Array<string | number>
}

const CATEGORY_KEYS = ['DT', 'transport', 'alimentation', 'divers', 'logement'] as const

const CATEGORY_TONE_CLASSES = [styles.toneA, styles.toneB, styles.toneC, styles.toneD, styles.toneE]

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
  onRestart?: () => void
  surveyId: string
  model: RawRules
  restoreFromStorage?: boolean
}

type StoredSurveyState = {
  situation?: Situation<string>
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isSituation = (value: unknown): value is Situation<string> => {
  if (!isRecord(value)) {
    return false
  }
  return Object.values(value).every(
    (entry) => entry === null || typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean',
  )
}

const hasStoredSituation = (value: StoredSurveyState | null): value is { situation: Situation<string> } => {
  return Boolean(value && isSituation(value.situation))
}

const SurveyCompletion = ({ onRestart, surveyId, model, restoreFromStorage = false }: Props) => {
  const t = useTranslations('survey.completion')
  const { engine } = useMipPublicodes()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'keyActions' | 'library'>('keyActions')
  const [isHydrated, setIsHydrated] = useState(!restoreFromStorage)

  useEffect(() => {
    if (!restoreFromStorage) {
      return
    }

    const savedState = loadSurveyState<StoredSurveyState>(surveyId)
    if (hasStoredSituation(savedState)) {
      engine.setSituation(savedState.situation)
    }
    setIsHydrated(true)
  }, [engine, restoreFromStorage, surveyId])

  const totalEval = engine.evaluate('bilan')
  const totalKg = typeof totalEval.nodeValue === 'number' ? Math.max(0, totalEval.nodeValue) : 0

  const categories = useMemo<CategoryResult[]>(() => {
    return CATEGORY_KEYS.map((key) => {
      const result = engine.evaluate(key)
      const valueKg = typeof result.nodeValue === 'number' ? Math.max(0, result.nodeValue) : 0
      const rule = model?.[key] as ModelRule | undefined
      return {
        key,
        titre: rule?.titre ?? key,
        icônes: rule?.icônes ?? '',
        valueKg,
      }
    }).sort((a, b) => b.valueKg - a.valueKg)
  }, [engine, model])

  const actions = useMemo<ActionResult[]>(() => {
    const actionsRule = model?.['actions'] as { somme?: Array<string | number> } | null | undefined
    const actionKeys = (actionsRule?.somme ?? []).filter((value): value is string => typeof value === 'string')

    return actionKeys
      .flatMap((key) => {
        try {
          const result = engine.evaluate(key)
          const savingsKg = typeof result.nodeValue === 'number' ? Math.max(0, result.nodeValue) : 0
          const rule = model?.[key] as ModelRule | undefined
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
      .filter((action) => action.savingsKg > 0)
      .sort((a, b) => b.savingsKg - a.savingsKg)
  }, [engine, model])

  const topCategories = categories.slice(0, 3)
  const actionsByCategory = categories.map((category) => ({
    ...category,
    actions: actions.filter((action) => action.categoryKey === category.key),
  }))

  const handleRestart = () => {
    clearSurveyState(surveyId)
    if (onRestart) {
      onRestart()
      return
    }
    router.push(`/survey/${surveyId}`)
  }

  if (!isHydrated) {
    return <Typography>{t('loadingState')}</Typography>
  }

  return (
    <div className={styles.scrollWrapper}>
      <Container maxWidth="md" className={`${styles.page} pt2`}>
        <section className={`${styles.footprintBanner} p2 mb2`} data-testid="survey-completion-footprint-banner">
          <Typography variant="h4" className={styles.footprintBannerTitle}>
            {t('title')}
          </Typography>
          <div className={styles.footprintDisplay}>
            <Typography className={styles.footprintValue}>{formatNumber(Math.round(totalKg))}</Typography>
            <Typography className={styles.footprintUnit}>{t('unit')}</Typography>
          </div>
          <Typography className={styles.bannerDescription}>{t('headlineDescription')}</Typography>
        </section>

        <section className="mb2" data-testid="survey-completion-actions">
          <Typography variant="h6" className={styles.sectionTitle}>
            {t('actions.title')}
          </Typography>
          <Tabs
            value={activeTab}
            onChange={(_event, newValue: 'keyActions' | 'library') => setActiveTab(newValue)}
            className={styles.tabs}
          >
            <Tab value="keyActions" label={t('actions.keyTab')} />
            <Tab value="library" label={t('actions.libraryTab')} />
          </Tabs>

          {activeTab === 'keyActions' && (
            <div className="flex-col gapped1 mt1">
              {topCategories.map((category, index) => {
                const categoryActions = actions.filter((action) => action.categoryKey === category.key).slice(0, 4)
                const categoryShare = totalKg > 0 ? Math.round((category.valueKg / totalKg) * 100) : 0

                return (
                  <Card
                    key={category.key}
                    className={styles.keyCategoryCard}
                    data-testid={`category-actions-${category.key}`}
                  >
                    <CardContent className="p125">
                      <div className="align-center gapped075 mb1">
                        <Typography className={styles.categoryRankBadge}>{index + 1}</Typography>
                        <Typography className={styles.categoryEmoji}>{category.icônes}</Typography>
                        <Typography className={styles.keyCategoryTitle}>{category.titre}</Typography>
                        <Typography className={styles.categoryPercent}>{categoryShare} %</Typography>
                      </div>
                      {categoryActions.length > 0 ? (
                        <div className="flex-col gapped075">
                          {categoryActions.map((action) => (
                            <div key={action.key} className={styles.actionRow}>
                              <Typography className={styles.actionIcon}>{action.icônes}</Typography>
                              <Typography className={styles.actionTitle}>{action.titre}</Typography>
                              <Typography className={styles.actionImpact}>
                                {formatNumber(Math.round(action.savingsKg))} {t('kgUnit')}
                              </Typography>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Typography className={styles.emptyActions}>{t('actions.noActions')}</Typography>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="flex-col gapped075 mt1">
              {actionsByCategory.map((category) => (
                <Accordion key={category.key} className={styles.libraryAccordion}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <div className="align-center gapped075">
                      <Typography className={styles.categoryEmoji}>{category.icônes}</Typography>
                      <Typography className={styles.libraryTitle}>{category.titre}</Typography>
                      <Typography className={styles.libraryCount}>
                        {category.actions.length} {t('actions.available')}
                      </Typography>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    {category.actions.length > 0 ? (
                      <div className="flex-col gapped075">
                        {category.actions.map((action) => (
                          <div key={action.key} className={styles.libraryActionRow}>
                            <Typography className={styles.actionIcon}>{action.icônes}</Typography>
                            <Typography className={styles.actionTitle}>{action.titre}</Typography>
                            <Typography className={styles.actionImpact}>
                              {formatNumber(Math.round(action.savingsKg))} {t('kgUnit')}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography className={styles.emptyActions}>{t('actions.noActions')}</Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          )}
        </section>

        <section className="mb2" data-testid="survey-completion-summary">
          <Typography variant="h6" className={styles.sectionTitle}>
            {t('summary.title')}
          </Typography>
          <div className="flex-col gapped1">
            {actionsByCategory.map((category, index) => {
              const toneClass = CATEGORY_TONE_CLASSES[index % CATEGORY_TONE_CLASSES.length]
              const categoryShare = totalKg > 0 ? Math.round((category.valueKg / totalKg) * 100) : 0
              return (
                <Accordion key={category.key} className={styles.summaryAccordion}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <div className={`${styles.summaryItem} gapped075`}>
                      <Typography className={styles.summaryIcon}>{category.icônes}</Typography>
                      <Typography className={styles.summaryName}>{category.titre}</Typography>
                      <div className={styles.equalBarTrack}>
                        <div className={`${styles.equalBarFill} ${toneClass}`} />
                      </div>
                      <Typography className={styles.summaryValue}>
                        {formatNumber(Math.round(category.valueKg))} {t('kgUnit')}
                      </Typography>
                      <Typography className={styles.summaryPercent}>{categoryShare} %</Typography>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    {category.actions.length > 0 ? (
                      <div className="flex-col gapped075">
                        {category.actions.map((action) => (
                          <div key={action.key} className={styles.libraryActionRow}>
                            <Typography className={styles.actionIcon}>{action.icônes}</Typography>
                            <Typography className={styles.actionTitle}>{action.titre}</Typography>
                            <Typography className={styles.actionImpact}>
                              {formatNumber(Math.round(action.savingsKg))} {t('kgUnit')}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Typography className={styles.emptyActions}>{t('actions.noActions')}</Typography>
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

        <section className="mb2" data-testid="survey-completion-top-categories">
          <Typography variant="h6" className={styles.sectionTitle}>
            {t('topCategories.title')}
          </Typography>
          <div className="flex-col gapped075">
            {topCategories.map((category, index) => (
              <div key={category.key} className={`${styles.topCategoryItem} align-center gapped1`}>
                <Typography className={styles.topCategoryRank}>{index + 1}</Typography>
                <Typography className={styles.topCategoryIcon}>{category.icônes}</Typography>
                <Typography className={styles.topCategoryName}>{category.titre}</Typography>
                <Typography className={styles.topCategoryValue}>
                  {formatNumber(Math.round(category.valueKg))} {t('kgUnit')}
                </Typography>
              </div>
            ))}
          </div>
        </section>

        <CollectiveEffortEncart />

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

        <div className="justify-center wrap gapped075 mt1">
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRestart}>
            {t('restart')}
          </Button>
          <Button component={Link} href={`/dashboard/${surveyId}`} variant="contained">
            {t('adminResults')}
          </Button>
        </div>
      </Container>
    </div>
  )
}

export default SurveyCompletion
