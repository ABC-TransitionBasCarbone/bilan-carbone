'use client'

import { KeyStatGroup } from '@/types/results.types'
import { Card, CardContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import KeyStatGroupItem from './KeyStatGroupItem'
import styles from './KeyStatsSection.module.css'

interface Props {
  keyStats: KeyStatGroup[]
  visibleStatsByGroup?: Partial<Record<string, string[]>>
}

const DEFAULT_VISIBLE_STATS_BY_GROUP: Partial<Record<string, string[]>> = {
  commute: [
    'carModeShare',
    'publicTransportModeShare',
    'activeModeShare',
    'avgCarKm',
    'avgPublicTransportKm',
    'avgEmissionPerMode',
  ],
  travel: [
    'trainModeShare',
    'carTravelModeShare',
    'planeTravelModeShare',
    'avgTravelKmByMode',
    'avgTravelEmissionByMode',
    'avgTravelNights',
  ],
  food: [
    'vegMealsShare',
    'veganMealsShare',
    'fullyVegetarianEmployees',
    'fullyVeganEmployees',
    'redMeatDailyEmployees',
  ],
  digital: ['aiRequestsPerDay', 'videoHoursPerDay', 'internetHoursPerDay'],
}

const KeyStatsSection = ({ keyStats, visibleStatsByGroup = DEFAULT_VISIBLE_STATS_BY_GROUP }: Props) => {
  const t = useTranslations('results')

  const filteredGroups = keyStats.reduce<KeyStatGroup[]>((acc, group) => {
    const visibleStats = visibleStatsByGroup[group.key]

    if (!visibleStats?.length) {
      if (group.stats.length > 0) {
        acc.push(group)
      }
      return acc
    }

    const stats = group.stats.filter((stat) => visibleStats.includes(stat.key))
    if (stats.length > 0) {
      acc.push({ ...group, stats })
    }

    return acc
  }, [])

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('keyStats.title')}
      </Typography>
      <Card>
        <CardContent className="p15">
          <div className={`${styles.keyStatsGrid} gapped15`}>
            {filteredGroups.map((group) => (
              <KeyStatGroupItem key={group.key} group={group} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default KeyStatsSection
