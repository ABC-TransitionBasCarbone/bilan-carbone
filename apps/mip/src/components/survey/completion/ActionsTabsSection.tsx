'use client'

import EquivalentSection from '@/components/results/EquivalentSection'
import { CategoryWithActions } from '@/components/survey/completion/types'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Card, CardContent, Tab, Tabs, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from '../SurveyCompletion.module.css'

interface Props {
  keyActionCategories: CategoryWithActions[]
  totalKg: number
}

const ActionsTabsSection = ({ keyActionCategories, totalKg }: Props) => {
  const t = useTranslations('survey.completion')
  const [activeTab, setActiveTab] = useState<'keyActions' | 'equivalent'>('keyActions')

  return (
    <section className="mb2" data-testid="survey-completion-actions">
      <Typography variant="h6" className={styles.sectionTitle}>
        {activeTab === 'equivalent' ? t('actions.equivalentTab') : t('actions.title')}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_event, newValue: 'keyActions' | 'equivalent') => setActiveTab(newValue)}
        className={styles.tabs}
      >
        <Tab value="keyActions" label={t('actions.keyTab')} />
        <Tab value="equivalent" label={t('actions.equivalentTab')} />
      </Tabs>

      {activeTab === 'keyActions' && (
        <div className="flex-col gapped1 mt1">
          {keyActionCategories.map((category, index) => {
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
                    <Typography className={styles.categoryEmoji}>{category.icones}</Typography>
                    <Typography className={styles.keyCategoryTitle}>{category.titre}</Typography>
                    <Typography className={styles.categoryPercent}>{categoryShare} %</Typography>
                  </div>

                  <div className="flex-col gapped075">
                    {category.actions.map((action) => (
                      <div key={action.key} className={styles.actionRow}>
                        <Typography className={styles.actionIcon}>{action.icones}</Typography>
                        <Typography className={styles.actionTitle}>{action.titre}</Typography>
                        <Typography className={styles.actionImpact}>
                          {formatNumber(Math.round(action.savingsKg))} {t('kgUnit')}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'equivalent' && (
        <div className="mt1">
          <EquivalentSection averageFootprintKg={totalKg} />
        </div>
      )}
    </section>
  )
}

export default ActionsTabsSection
