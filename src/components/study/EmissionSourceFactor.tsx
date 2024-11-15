import Fuse from 'fuse.js'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { Path } from 'react-hook-form'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import styles from './EmissionSourceFactor.module.css'
import classNames from 'classnames'
import DebouncedInput from '../base/DebouncedInput'
import { getQualityRating } from '@/services/uncertainty'

const fuseOptions = {
  keys: [
    {
      name: 'title',
      getFn: (emissionFactor: EmissionFactorWithMetaData) => emissionFactor.metaData?.title || '',
      weight: 1,
    },
    {
      name: 'sublocation',
      getFn: (emissionFactor: EmissionFactorWithMetaData) => emissionFactor.metaData?.location || '',
      weight: 0.7,
    },
    {
      name: 'location',
      getFn: (emissionFactor: EmissionFactorWithMetaData) => emissionFactor.location || '',
      weight: 0.3,
    },
    {
      name: 'detail',
      getFn: (emissionFactor: EmissionFactorWithMetaData) =>
        `${emissionFactor.metaData?.attribute || ''}  ${emissionFactor.metaData?.comment || ''}`,
      weight: 0.5,
    },
  ],
  threshold: 0.3,
  isCaseSensitive: false,
  includeScore: true,
}

interface Props {
  emissionFactors: EmissionFactorWithMetaData[]
  update: (name: Path<UpdateEmissionSourceCommand>, value: string) => void
  selectedFactor?: EmissionFactorWithMetaData | null
  canEdit: boolean | null
}

const getDetail = (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) => {
  return [metadata.attribute, metadata.comment, metadata.location].filter(Boolean).join(' - ')
}

const EmissionSourceFactor = ({ emissionFactors, update, selectedFactor, canEdit }: Props) => {
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tQuality = useTranslations('quality')

  const [display, setDisplay] = useState(false)
  const [value, setValue] = useState('')
  const [results, setResults] = useState<EmissionFactorWithMetaData[]>([])

  useEffect(() => {
    setValue(selectedFactor?.metaData?.title || '')
  }, [selectedFactor])

  const fuse = useMemo(() => {
    return new Fuse(
      emissionFactors.filter((emissionFactor) => emissionFactor.metaData),
      fuseOptions,
    )
  }, [emissionFactors])

  useEffect(() => {
    setResults(value ? fuse.search(value).map(({ item }) => item) : [])
  }, [fuse, value])

  const qualityRating = useMemo(() => (selectedFactor ? getQualityRating(selectedFactor) : null), [selectedFactor])
  return (
    <>
      <div className={classNames(styles.factor, 'align-center')}>
        <DebouncedInput
          disabled={!canEdit}
          data-testid="emission-source-factor-search"
          debounce={200}
          value={value}
          onChange={setValue}
          label={t('form.emissionFactor')}
          onFocus={() => setDisplay(true)}
        />
        {selectedFactor && (
          <div data-testid="emission-source-factor">
            <p className={styles.header}>
              {selectedFactor.metaData?.title} - {selectedFactor.location} - {selectedFactor.totalCo2} kgCO₂e/
              {tUnits(selectedFactor.unit)}{' '}
              {qualityRating && `- ${tQuality('name')} ${tQuality(qualityRating.toString())}`}
            </p>
            {selectedFactor.metaData && <p className={styles.detail}>{getDetail(selectedFactor.metaData)}</p>}
          </div>
        )}
      </div>
      {display && value && (
        <div className={styles.suggestions}>
          {results.map((result) => (
            <button
              data-testid="emission-source-factor-suggestion"
              key={result.id}
              className={styles.suggestion}
              onClick={() => {
                update('emissionFactorId', result.id)
                setDisplay(false)
              }}
            >
              <p className={styles.header}>
                {result.metaData?.title} - {result.location} - {result.totalCo2} kgCO₂e/
                {tUnits(result.unit)}
              </p>
              {result.metaData && <p className={styles.detail}>{getDetail(result.metaData)}</p>}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default EmissionSourceFactor
