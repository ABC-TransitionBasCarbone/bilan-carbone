'use client'

import { FullStudy } from '@/db/study'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { getSpecificEmissionFactorQualityColumn, qualityKeys } from '@/services/uncertainty'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Path } from 'react-hook-form'
import Button from '../base/Button'
import HelpIcon from '../base/HelpIcon'
import QualitySelect from '../form/QualitySelect'
import styles from './EmissionSource.module.css'
interface Props {
  advanced?: boolean
  canEdit: boolean | null
  emissionSource: FullStudy['emissionSources'][0]
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean) => void
  setGlossary: (key: string) => void
  expanded: boolean
  setExpanded: (value: boolean) => void
  canShrink: boolean
  defaultQuality?: number | null
  feSpecific?: boolean
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
  feSpecific,
}: Props) => {
  const t = useTranslations('emissionSource')
  const tGlossary = useTranslations('emissionSource.glossary')

  const getField = (field: (typeof qualityKeys)[number]) =>
    feSpecific ? getSpecificEmissionFactorQualityColumn[field] : field

  return (
    <div className={classNames('flex grow', expanded ? styles.row : styles.shrinked)}>
      {expanded ? (
        <>
          {qualityKeys.map((field) => (
            <QualitySelect
              key={`qualify-${getField(field)}`}
              disabled={!canEdit}
              data-testid={`emission-source-${getField(field)}`}
              id={getField(field)}
              value={emissionSource[getField(field)] || ''}
              onChange={(event) => update(getField(field), Number(event.target.value))}
              label={t(`form.${field}`)}
            />
          ))}
        </>
      ) : (
        <QualitySelect
          disabled={!canEdit}
          data-testid="emission-source-quality-select"
          id="quality"
          value={defaultQuality || ''}
          onChange={(event) => {
            qualityKeys.forEach((field) => {
              update(getField(field), Number(event.target.value))
            })
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
