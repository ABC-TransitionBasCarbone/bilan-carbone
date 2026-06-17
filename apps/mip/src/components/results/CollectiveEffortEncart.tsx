'use client'

import { CollectiveEffortEncart as UiCollectiveEffortEncart, CollectiveEffortEncartItem } from '@abc-transitionbascarbone/ui'
import { useTranslations } from 'next-intl'

const ACTOR_KEYS = ['state', 'collectivities', 'companies'] as const

export default function CollectiveEffortEncart() {
  const t = useTranslations('results.collectiveEffort')

  const items: CollectiveEffortEncartItem[] = ACTOR_KEYS.map((key) => ({
    key,
    tone: key,
    label: t(`${key}.label` as Parameters<typeof t>[0]),
    description: t(`${key}.description` as Parameters<typeof t>[0]),
  }))

  return <UiCollectiveEffortEncart title={t('title')} items={items} />
}
