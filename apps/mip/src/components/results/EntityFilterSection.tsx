'use client'

import { EntityFilter } from '@/data/sampleResults'
import { BaseStyledChip } from '@abc-transitionbascarbone/ui'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

interface Props {
  entities: EntityFilter[]
  selectedEntity: string
  onSelectEntity: (id: string) => void
}

const EntityFilterSection = ({ entities, selectedEntity, onSelectEntity }: Props) => {
  const t = useTranslations('results')

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('filter.title')}
      </Typography>
      <div className="flex wrap gapped-2">
        {entities.map((entity) => (
          <BaseStyledChip
            key={entity.id}
            label={entity.name}
            color={selectedEntity === entity.id ? 'primary' : 'default'}
            onClick={() => onSelectEntity(entity.id)}
            clickable
          />
        ))}
      </div>
    </section>
  )
}

export default EntityFilterSection
