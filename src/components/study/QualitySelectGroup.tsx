'use client'

import { qualityKeys } from '@/services/uncertainty'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Button from '../base/Button'
import HelpIcon from '../base/HelpIcon'
import QualitySelect from '../form/QualitySelect'
import styles from './EmissionSource.module.css'

type Source = Partial<Record<(typeof qualityKeys)[number], number | null>>

interface Props {
  advanced?: boolean
  canEdit: boolean | null
  emissionSource: Source
  update: (key: keyof Source, value: string | number | boolean) => void
  setGlossary: (key: string) => void
  expanded: boolean
  setExpanded: (value: boolean) => void
  canShrink: boolean
  defaultQuality?: number | null
}

const QualitySelectGroup = ({
  advanced,
  canEdit,
  emissionSource,
  update,
  setGlossary,
  expanded,
  setExpanded,
  canShrink,
  defaultQuality,
}: Props) => {
  const t = useTranslations('emissionSource')
  const tGlossary = useTranslations('emissionSource.glossary')

  return (
    <div className={classNames('flex grow', expanded ? styles.row : styles.shrinked)}>
      {expanded ? (
        <>
          <QualitySelect
            disabled={!canEdit}
            data-testid="emission-source-reliability"
            id="reliability"
            value={emissionSource.reliability || ''}
            onChange={(event) => update('reliability', Number(event.target.value))}
            label={t('form.reliability')}
          />
          <QualitySelect
            disabled={!canEdit}
            data-testid="emission-source-technicalRepresentativeness"
            id="technicalRepresentativeness"
            value={emissionSource.technicalRepresentativeness || ''}
            onChange={(event) => update('technicalRepresentativeness', Number(event.target.value))}
            label={t('form.technicalRepresentativeness')}
          />
          <QualitySelect
            disabled={!canEdit}
            data-testid="emission-source-geographicRepresentativeness"
            id="geographicRepresentativeness"
            value={emissionSource.geographicRepresentativeness || ''}
            onChange={(event) => update('geographicRepresentativeness', Number(event.target.value))}
            label={t('form.geographicRepresentativeness')}
          />
          <QualitySelect
            disabled={!canEdit}
            data-testid="emission-source-temporalRepresentativeness"
            id="temporalRepresentativeness"
            value={emissionSource.temporalRepresentativeness || ''}
            onChange={(event) => update('temporalRepresentativeness', Number(event.target.value))}
            label={t('form.temporalRepresentativeness')}
          />
          <QualitySelect
            disabled={!canEdit}
            data-testid="emission-source-completeness"
            id="completeness"
            value={emissionSource.completeness || ''}
            onChange={(event) => update('completeness', Number(event.target.value))}
            label={t('form.completeness')}
          />
        </>
      ) : (
        <QualitySelect
          disabled={!canEdit}
          data-testid="emission-source-quality-select"
          id="completeness"
          value={defaultQuality || ''}
          onChange={(event) => {
            update('reliability', Number(event.target.value))
            update('technicalRepresentativeness', Number(event.target.value))
            update('geographicRepresentativeness', Number(event.target.value))
            update('temporalRepresentativeness', Number(event.target.value))
            update('completeness', Number(event.target.value))
          }}
          label={t('form.quality')}
        />
      )}
      <HelpIcon onClick={() => setGlossary('quality')} label={tGlossary('title')} />
      {!advanced && canShrink && (
        <Button
          data-testid="emission-source-quality-expand-button"
          onClick={() => setExpanded(!expanded)}
          title={t(expanded ? 'form.shrink' : 'form.expand')}
          aria-label={t(expanded ? 'form.shrink' : 'form.expand')}
        >
          {expanded ? <ZoomInMapIcon /> : <ZoomOutMapIcon />}
        </Button>
      )}
    </div>
  )
}

export default QualitySelectGroup
