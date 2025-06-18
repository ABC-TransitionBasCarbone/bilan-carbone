import Block from '@/components/base/Block'
import TextUnitInput from '@/components/questions/TextUnitInput'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { getEmissionResultsCut } from '@/services/emissionSource'
import { EmissionFactorWithMetaData, getEmissionFactorByImportedId } from '@/services/serverFunctions/emissionFactor'
import { createEmissionSource, updateEmissionSource } from '@/services/serverFunctions/emissionSource'
import { UpdateEmissionSourceCommandValidation } from '@/services/serverFunctions/emissionSource.command'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { EmissionSourceCaracterisation, EmissionSourceType, SubPost, Unit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Question } from '../services/post'
import styles from './SubPostField.module.css'

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
  const tResultstUnits = useTranslations('study.results.units')
  const tQuality = useTranslations('quality')
  const tEmissionSource = useTranslations('emissionSource')

  const { studySite } = useStudySite(study)

  const [emissionFactor, setEmissionFactor] = useState<EmissionFactorWithMetaData | null>(null)
  const [error, setError] = useState('')
  const [currentValue, setCurrentValue] = useState<string>()

  const emissionSourcesFiltered = useMemo(
    () => emissionSources?.filter((emissionSource) => emissionSource.name === question.key) || [],
    [emissionSources, question.key],
  )

  const emissionSource = useMemo(() => emissionSourcesFiltered[0] || null, [emissionSourcesFiltered])

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

  const unit = useMemo(() => {
    if (!emissionFactor) {
      return null
    }
    return emissionFactor.unit === Unit.CUSTOM ? emissionFactor.customUnit : emissionFactor.unit
  }, [emissionFactor])

  const handleUpdate = async (emissionSourceId?: string | null) => {
    const value = parseInt(currentValue || '') || undefined

    if (!value) {
      return
    }

    const name = question.key
    if (value && value < 0) {
      setError(`${tEmissionSource('form.sign')}`)
      setCurrentValue('0')
      return
    }
    setError('')

    try {
      if (emissionSourceId) {
        const command = {
          emissionSourceId,
          value,
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
        })
        if (!result.success) {
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

  return (
    <Block title={tCutQuestions(question.key, { value: question?.value || '' })}>
      <div className="flex mt1">
        <TextUnitInput
          unit={unit}
          format={question.format}
          className="grow"
          disabled={isLoading}
          value={currentValue ?? emissionSource?.value?.toString() ?? ''}
          onChange={(value) => !isLoading && setCurrentValue(value)}
          onUpdate={() => handleUpdate(emissionSource?.id)}
          label={`${tEmissionSource('cut.form.value')} *`}
          helperText={error}
          error={!!error}
        />
      </div>
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
