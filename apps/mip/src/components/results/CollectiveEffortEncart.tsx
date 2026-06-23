'use client'

import {
  CollectiveEffortEncartItem,
  CollectiveEffortEncart as UiCollectiveEffortEncart,
} from '@abc-transitionbascarbone/ui'
import { useTranslations } from 'next-intl'

const ACTOR_KEYS = ['state', 'collectivities', 'companies'] as const

const CollectiveEffortEncart = () => {
  const t = useTranslations('results.collectiveEffort')

  const items: CollectiveEffortEncartItem[] = ACTOR_KEYS.map((key) => ({
    key,
    tone: key,
    label: t(`${key}.label` as Parameters<typeof t>[0]),
    description: t.rich(`${key}.description` as Parameters<typeof t>[0], {
      strong: (chunks) => <strong>{chunks}</strong>,
    }),
  }))

  return <UiCollectiveEffortEncart title={t('title')} items={items} />
}

export default CollectiveEffortEncart
