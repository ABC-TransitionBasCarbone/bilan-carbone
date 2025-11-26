import { EmissionFactorList } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { useUnitLabel } from '@/services/unit'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber } from '@/utils/number'
import { displayOnlyExistingDataWithDash } from '@/utils/string'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { EmissionFactorStatus, StudyResultUnit, SubPost, Unit } from '@prisma/client'
import classNames from 'classnames'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Path } from 'react-hook-form'
import Button from '../base/Button'
import DebouncedInput from '../base/DebouncedInput'
import { ImportVersionForFilters } from '../emissionFactor/EmissionFactorsFilters'
import Modal from '../modals/Modal'
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
  subPost: SubPost
  selectedFactor?: FullStudy['emissionSources'][0]['emissionFactor'] & {
    metaData: EmissionFactorList['metaData']
  }
  canEdit: boolean | null
  isFromOldImport: boolean
  currentBEVersion: string
  userOrganizationId?: string
  emissionFactorsForSubPost: EmissionFactorWithMetaData[]
  importVersions: ImportVersionForFilters[]
  studyId: string
  getDetail: (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) => string
  update: (name: Path<UpdateEmissionSourceCommand>, value: string | null) => void
}

const EmissionSourceFactor = ({
  subPost,
  selectedFactor,
  canEdit,
  isFromOldImport,
  currentBEVersion,
  userOrganizationId,
  emissionFactorsForSubPost,
  importVersions,
  studyId,
  getDetail,
  update,
}: Props) => {
  const { environment } = useAppEnvironmentStore()
  const t = useTranslations('emissionSource')
  const tResultUnits = useTranslations('study.results.units')
  const getUnitLabel = useUnitLabel()
  const [advancedSearch, setAdvancedSearch] = useState(false)
  const [display, setDisplay] = useState(false)
  const [oldFactorAction, setOldFactorAction] = useState<'fieldSearch' | 'search' | 'clear' | undefined>(undefined)
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
      emissionFactorsForSubPost
        .filter((emissionFactor) => emissionFactor.metaData)
        .filter((ef) => ef.status !== EmissionFactorStatus.Archived),
      fuseOptions,
    )
  }, [emissionFactorsForSubPost])

  const searchNewEmissionFactor = () => setAdvancedSearch(true)
  const clearEmissionFactor = () => update('emissionFactorId', null)

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

  if (!environment) {
    return null
  }

  return (
    <div ref={containerRef}>
      <div className="align-center gapped">
        <div className={classNames(styles.inputContainer, 'grow', { [styles.withSearch]: canEdit })}>
          <DebouncedInput
            disabled={!canEdit}
            data-testid="emission-source-factor-search"
            debounce={200}
            value={value}
            onChange={setValue}
            label={`${t('form.emissionFactor')} *`}
            onClick={() => (isFromOldImport ? setOldFactorAction('fieldSearch') : setDisplay(true))}
          />
          {canEdit && (
            <>
              {selectedFactor && (
                <button
                  className={styles.clear}
                  aria-label={t('clear')}
                  title={t('clear')}
                  onClick={() => (isFromOldImport ? setOldFactorAction('clear') : clearEmissionFactor())}
                >
                  <ClearIcon />
                </button>
              )}
              <button
                className={styles.search}
                aria-label={t('advancedSearch')}
                title={t('advancedSearch')}
                onClick={() => (isFromOldImport ? setOldFactorAction('search') : searchNewEmissionFactor())}
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
                  formatEmissionFactorNumber(getEmissionFactorValue(result, environment)),
                ])}{' '}
                {tResultUnits(StudyResultUnit.K)}/
                {result.unit === Unit.CUSTOM
                  ? result.customUnit
                  : getUnitLabel(result.unit || '', getEmissionFactorValue(result, environment))}
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
          environment={environment}
          userOrganizationId={userOrganizationId}
          close={() => setAdvancedSearch(false)}
          defaultSubPost={subPost}
          importVersions={importVersions}
          selectEmissionFactor={(emissionFactor) => {
            update('emissionFactorId', emissionFactor.id)
            setDisplay(false)
            setAdvancedSearch(false)
          }}
          studyId={studyId}
        />
      )}
      <Modal
        open={!!oldFactorAction}
        title={t('glossary.version')}
        label="old-version-action"
        onClose={() => setOldFactorAction(undefined)}
      >
        <>
          {t('glossary.versionDescription', { bcVersion: currentBEVersion })}
          <div className="justify-end mt1 gapped">
            <Button onClick={() => setOldFactorAction(undefined)}>{t('duplicateDialog.cancel')}</Button>
            <Button
              onClick={() => {
                if (oldFactorAction === 'clear') {
                  clearEmissionFactor()
                } else if (oldFactorAction === 'search') {
                  searchNewEmissionFactor()
                } else if (oldFactorAction === 'fieldSearch') {
                  setDisplay(true)
                }
                setOldFactorAction(undefined)
              }}
            >
              {t('duplicateDialog.confirm')}
            </Button>
          </div>
        </>
      </Modal>
    </div>
  )
}

export default EmissionSourceFactor
