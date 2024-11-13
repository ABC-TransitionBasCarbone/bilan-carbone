import Fuse from 'fuse.js'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { useTranslations } from 'next-intl'
import React, { useEffect, useMemo, useState } from 'react'
import { Path } from 'react-hook-form'
import { EmissionWithMetaData } from '@/services/emissions'
import styles from './EmissionSourceFactor.module.css'
import classNames from 'classnames'
import DebouncedInput from '../base/DebouncedInput'

const fuseOptions = {
  keys: [
    {
      name: 'title',
      getFn: (emission: EmissionWithMetaData) => emission.metaData?.title || '',
      weight: 1,
    },
    {
      name: 'sublocation',
      getFn: (emission: EmissionWithMetaData) => emission.metaData?.location || '',
      weight: 0.7,
    },
    {
      name: 'location',
      getFn: (emission: EmissionWithMetaData) => emission.location || '',
      weight: 0.3,
    },
    {
      name: 'detail',
      getFn: (emission: EmissionWithMetaData) =>
        `${emission.metaData?.attribute || ''}  ${emission.metaData?.comment || ''}`,
      weight: 0.5,
    },
  ],
  threshold: 0.3,
  isCaseSensitive: false,
  includeScore: true,
}

interface Props {
  emissions: EmissionWithMetaData[]
  update: (name: Path<UpdateEmissionSourceCommand>, value: string) => void
  selectedFactor?: EmissionWithMetaData | null
}

const getDetail = (metadata: Exclude<EmissionWithMetaData['metaData'], undefined>) => {
  return [metadata.attribute, metadata.comment, metadata.location].filter(Boolean).join(' - ')
}

const EmissionSourceFactor = ({ emissions, update, selectedFactor }: Props) => {
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')

  const [display, setDisplay] = useState(false)
  const [value, setValue] = useState('')
  const [results, setResults] = useState<EmissionWithMetaData[]>([])

  useEffect(() => {
    setValue(selectedFactor?.metaData?.title || '')
  }, [selectedFactor])

  const fuse = useMemo(() => {
    return new Fuse(
      emissions.filter((emission) => emission.metaData),
      fuseOptions,
    )
  }, [emissions])

  useEffect(() => {
    setResults(value ? fuse.search(value).map(({ item }) => item) : [])
  }, [fuse, value])

  return (
    <>
      <div className={classNames(styles.factor, 'align-center')}>
        <DebouncedInput
          debounce={200}
          value={value}
          onChange={setValue}
          label={t('form.emissionFactor')}
          onFocus={() => setDisplay(true)}
        />
        {selectedFactor && (
          <div>
            <p className={styles.header}>
              {selectedFactor.metaData?.title} - {selectedFactor.location} - {selectedFactor.totalCo2} kgCO₂e/
              {tUnits(selectedFactor.unit)}
            </p>
            {selectedFactor.metaData && <p className={styles.detail}>{getDetail(selectedFactor.metaData)}</p>}
          </div>
        )}
      </div>
      {display && value && (
        <div className={styles.suggestions}>
          {results.map((result) => (
            <button
              key={result.id}
              className={styles.suggestion}
              onClick={() => {
                update('emissionId', result.id)
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
