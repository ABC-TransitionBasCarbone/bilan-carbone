import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { displayOnlyExistingDataWithDash } from '@/utils/string'
import SearchIcon from '@mui/icons-material/Search'
import classNames from 'classnames'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Path } from 'react-hook-form'
import DebouncedInput from '../base/DebouncedInput'
import styles from './EmissionSourceFactor.module.css'
import EmissionSourceFactorModal from './EmissionSourceFactorModal'
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
  getDetail: (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) => string
}

const EmissionSourceFactor = ({ emissionFactors, update, selectedFactor, canEdit, getDetail }: Props) => {
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')

  const [advancedSearch, setAdvancedSearch] = useState(false)
  const [display, setDisplay] = useState(false)
  const [value, setValue] = useState('')
  const [results, setResults] = useState<EmissionFactorWithMetaData[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDisplay(false)
      }
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDisplay(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
    setResults(
      value
        ? fuse
            .search(value)
            .map(({ item }) => item)
            .slice(0, 30)
        : [],
    )
  }, [fuse, value])

  return (
    <div ref={containerRef}>
      <div className={classNames(styles.factor, 'align-center')}>
        <div className={classNames(styles.inputContainer, 'grow', { [styles.withSearch]: canEdit })}>
          <DebouncedInput
            disabled={!canEdit}
            data-testid="emission-source-factor-search"
            debounce={200}
            value={value}
            onChange={setValue}
            label={`${t('form.emissionFactor')} *`}
            onFocus={() => setDisplay(true)}
          />
          {canEdit && (
            <button
              className={styles.search}
              aria-label={t('advancedSearch')}
              title={t('advancedSearch')}
              onClick={() => setAdvancedSearch(true)}
            >
              <SearchIcon />
            </button>
          )}
        </div>
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
                {displayOnlyExistingDataWithDash([
                  result.metaData?.title,
                  result.metaData?.frontiere,
                  result.location,
                  result.metaData?.location,
                  result.totalCo2,
                ])}{' '}
                kgCO₂e/
                {tUnits(result.unit)}
              </p>
              {result.metaData && <p className={styles.detail}>{getDetail(result.metaData)}</p>}
            </button>
          ))}
          <button className={classNames(styles.suggestion, 'align-center')} onClick={() => setAdvancedSearch(true)}>
            <SearchIcon />
            {results.length === 0 ? t('noResults') : t('seeMore')}
          </button>
        </div>
      )}
      {advancedSearch && (
        <EmissionSourceFactorModal
          open={advancedSearch}
          close={() => setAdvancedSearch(false)}
          emissionFactors={emissionFactors}
          selectEmissionFactor={(emissionFactor) => {
            update('emissionFactorId', emissionFactor.id)
            setDisplay(false)
            setAdvancedSearch(false)
          }}
        />
      )}
    </div>
  )
}

export default EmissionSourceFactor
