import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber } from '@/utils/number'
import { displayOnlyExistingDataWithDash } from '@/utils/string'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { StudyResultUnit, SubPost, Unit } from '@prisma/client'
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
  subPost: SubPost
  update: (name: Path<UpdateEmissionSourceCommand>, value: string | null) => void
  selectedFactor?: EmissionFactorWithMetaData | null
  canEdit: boolean | null
  getDetail: (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) => string
}

const EmissionSourceFactor = ({ emissionFactors, subPost, update, selectedFactor, canEdit, getDetail }: Props) => {
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tResultUnits = useTranslations('study.results.units')

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

  const subPostEmissionFactors = useMemo(
    () => emissionFactors.filter((emissionFactor) => emissionFactor.subPosts.includes(subPost)),
    [emissionFactors, subPost],
  )
  const fuse = useMemo(() => {
    return new Fuse(
      subPostEmissionFactors.filter((emissionFactor) => emissionFactor.metaData),
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
            <>
              {selectedFactor && (
                <button
                  className={styles.clear}
                  aria-label={t('clear')}
                  title={t('clear')}
                  onClick={() => update('emissionFactorId', null)}
                >
                  <ClearIcon />
                </button>
              )}
              <button
                className={styles.search}
                aria-label={t('advancedSearch')}
                title={t('advancedSearch')}
                onClick={() => setAdvancedSearch(true)}
              >
                <SearchIcon />
              </button>
            </>
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
                  formatEmissionFactorNumber(getEmissionFactorValue(result)),
                ])}{' '}
                {tResultUnits(StudyResultUnit.K)}/
                {result.unit === Unit.CUSTOM ? result.customUnit : tUnits(result.unit || '')}
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
          subPost={subPost}
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
