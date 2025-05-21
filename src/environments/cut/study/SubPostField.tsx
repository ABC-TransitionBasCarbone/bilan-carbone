import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import DebouncedInput from '@/components/base/DebouncedInput'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { getEmissionResultsCut } from '@/services/emissionSource'
import { NOT_AUTHORIZED } from '@/services/permissions/check'
import { EmissionFactorWithMetaData, getEmissionFactorByImportedId } from '@/services/serverFunctions/emissionFactor'
import {
  createEmissionSource,
  deleteEmissionSource,
  updateEmissionSource,
} from '@/services/serverFunctions/emissionSource'
import { UpdateEmissionSourceCommandValidation } from '@/services/serverFunctions/emissionSource.command'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import DeleteIcon from '@mui/icons-material/Delete'
import { EmissionSourceCaracterisation, EmissionSourceType, SubPost, Unit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Question } from '../services/post'
import styles from './SubPostField.module.css'

type EmissionSourceLight = {
  id?: string | null
  name?: string | null
  value?: number | null
  depreciationPeriod?: number | null
  fakeId?: string | number | null
}

interface Props {
  isLoading: boolean
  subPost: SubPost
  emissionSources?: FullStudy['emissionSources']
  study: FullStudy
  question: Question
  callback?: () => void
}

const SubPostField = ({ subPost, emissionSources, study, question, callback, isLoading = false }: Props) => {
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const tUnits = useTranslations('units')
  const tResultstUnits = useTranslations('study.results.units')
  const tQuality = useTranslations('quality')
  const tEmissionSource = useTranslations('emissionSource')

  const { studySite } = useStudySite(study)

  const [emissionFactor, setEmissionFactor] = useState<EmissionFactorWithMetaData | null>(null)
  const [error, setError] = useState('')
  const [currentValues, setCurrentValues] = useState<Record<string, string>>({})
  const [currentDepreciationPeriodValues, setCurrentDepreciationPeriodValues] = useState<Record<string, string>>({})
  const [pendingEmissionSource, setPendingEmissionSource] = useState<EmissionSourceLight | null>({
    fakeId: `new-${Date.now()}`,
  })
  const [newEmissionSources, setNewEmissionSources] = useState<EmissionSourceLight[]>([])

  const emissionSourcesFiltered = useMemo(
    () => emissionSources?.filter((emissionSource) => emissionSource.name === question.key) || [],
    [emissionSources, question.key],
  )

  const extendedEmissionSources = useMemo(() => {
    const allEmissionSources = [
      ...emissionSourcesFiltered,
      ...newEmissionSources,
      pendingEmissionSource,
    ] as EmissionSourceLight[]

    const map = new Map<string, EmissionSourceLight>()

    for (const emissionSource of allEmissionSources) {
      if (!emissionSource?.id) {
        continue
      }

      const existingEmissionSource = map.get(emissionSource.id)
      if (existingEmissionSource) {
        const selectedEmissionSource = emissionSource.fakeId
          ? emissionSource
          : existingEmissionSource.fakeId
            ? existingEmissionSource
            : emissionSource
        map.set(emissionSource.id, selectedEmissionSource)
      } else {
        map.set(emissionSource.id, emissionSource)
      }
    }

    const processedEmissionSources = [...Array.from(map.values()), pendingEmissionSource]

    return processedEmissionSources
  }, [emissionSourcesFiltered, newEmissionSources, pendingEmissionSource])

  const emissionResultsArray = useMemo(
    () => emissionSourcesFiltered?.map((emissionSource) => getEmissionResultsCut(emissionSource)),
    [emissionSourcesFiltered],
  )

  const emissionResults = useMemo(() => {
    if (emissionResultsArray.length === 0) {
      return undefined
    }

    const totalEmission = emissionResultsArray.reduce((sum, result) => sum + (result?.emission ?? 0), 0)

    return {
      ...emissionResultsArray[0],
      emission: totalEmission,
    }
  }, [emissionResultsArray])

  useEffect(() => {
    const fetchEmissionFactor = async () => {
      const result = await getEmissionFactorByImportedId(question.importedEmissionFactorId)
      if (result.success) {
        setEmissionFactor(result.data as EmissionFactorWithMetaData | null)
      }
    }

    if (question.importedEmissionFactorId) {
      fetchEmissionFactor()
    }
  }, [question])

  const handleUpdate = async (id: string | number, emissionSourceId?: string | null) => {
    const value = parseInt(currentValues[id] || '') || undefined
    const depreciationPeriod = parseInt(currentDepreciationPeriodValues[id] || '') || undefined

    if (!value && !depreciationPeriod) {
      return
    }

    const name = question.key
    if (value && value < 0) {
      setError(`${tEmissionSource('form.sign')}`)
      setCurrentValues((prev) => ({ ...prev, [id]: '0' }))
      return
    }
    setError('')

    try {
      if (emissionSourceId) {
        const command = {
          emissionSourceId,
          value,
          depreciationPeriod,
        }

        const isValid = UpdateEmissionSourceCommandValidation.safeParse(command)
        if (isValid.success) {
          await updateEmissionSource(isValid.data)
        }
      } else {
        const result = await createEmissionSource({
          name,
          subPost,
          studyId: study.id,
          studySiteId: studySite,
          caracterisation: EmissionSourceCaracterisation.Operated,
          type: EmissionSourceType.Physical,
          value,
          emissionFactorId: emissionFactor?.id,
          depreciationPeriod,
        })
        if (!(result === NOT_AUTHORIZED)) {
          setNewEmissionSources((prev) => [...prev, { ...result, fakeId: id }])
          const fakeId = `new-${Date.now()}`
          setPendingEmissionSource({ fakeId })
        } else {
          setError(tCutQuestions('error'))
        }
      }
    } catch {
      setError(tCutQuestions('error'))
    } finally {
      if (callback) {
        callback()
      }
    }
  }

  const handleDelete = async (emissionSourceId?: string | null) => {
    if (!emissionSourceId) {
      return
    }
    await deleteEmissionSource(emissionSourceId)
    setNewEmissionSources((prev) => prev.filter((emissionSource) => emissionSource.id !== emissionSourceId))
    if (callback) {
      callback()
    }
  }

  return (
    <Block title={tCutQuestions(question.key, { value: question?.value || '' })}>
      {extendedEmissionSources.map((emissionSource, index) => (
        <div key={emissionSource?.fakeId || emissionSource?.id || index} className="flex mt1">
          <div className={classNames(styles.inputWithUnit, 'flex grow mr1')}>
            <DebouncedInput
              debounce={50}
              className="grow"
              disabled={isLoading}
              type={question.type}
              value={
                currentValues[emissionSource?.id || emissionSource?.fakeId || index] ??
                emissionSource?.value?.toString() ??
                ''
              }
              onChange={(value) =>
                setCurrentValues((prev) => ({
                  ...prev,
                  [emissionSource?.id || emissionSource?.fakeId || index]: value,
                }))
              }
              onBlur={() => handleUpdate(emissionSource?.id || emissionSource?.fakeId || index, emissionSource?.id)}
              label={`${tEmissionSource('cut.form.value')} *`}
              helperText={error}
              error={!!error}
              slotProps={{
                htmlInput: { min: 0 },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                inputLabel: { shrink: true },
              }}
            />
            {emissionFactor && (
              <div className={styles.unit}>
                {emissionFactor.unit === Unit.CUSTOM ? emissionFactor.customUnit : tUnits(emissionFactor.unit || '')}
              </div>
            )}
          </div>
          <div className="mr1">
            {question.depreciationPeriod && (
              <DebouncedInput
                debounce={50}
                className="grow"
                disabled={isLoading}
                type={question.type}
                value={
                  currentDepreciationPeriodValues[emissionSource?.id || emissionSource?.fakeId || index] ??
                  emissionSource?.depreciationPeriod?.toString() ??
                  ''
                }
                onChange={(value) =>
                  setCurrentDepreciationPeriodValues((prev) => ({
                    ...prev,
                    [emissionSource?.id || emissionSource?.fakeId || index]: value,
                  }))
                }
                onBlur={() => handleUpdate(emissionSource?.id || emissionSource?.fakeId || index, emissionSource?.id)}
                label={`${tCutQuestions('numberOfYears')}`}
                slotProps={{
                  htmlInput: { min: 0 },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                  inputLabel: { shrink: true },
                }}
              />
            )}
          </div>
          {emissionSource?.id && (
            <Button className={styles.deleteButton} onClick={() => handleDelete(emissionSource.id)}>
              <DeleteIcon />
            </Button>
          )}
        </div>
      ))}
      {emissionResults && (
        <div className="mt1">
          <p>{`${formatNumber(emissionResults.emission / STUDY_UNIT_VALUES[study.resultsUnit])} ${tResultstUnits(study.resultsUnit)}`}</p>
          {emissionResults.standardDeviation && (
            <p className={styles.status}>
              {tQuality('name')} {tQuality(getStandardDeviationRating(emissionResults.standardDeviation).toString())}
            </p>
          )}
        </div>
      )}
    </Block>
  )
}

export default SubPostField
