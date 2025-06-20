import Block from '@/components/base/Block'
import { QCM } from '@/components/questions/QCM'
import TextUnitInput from '@/components/questions/TextUnitInput'
import TimePickerInput from '@/components/questions/TimePickerInput'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { getEmissionResultsCut } from '@/services/emissionSource'
import { EmissionFactorWithMetaData, getEmissionFactorByImportedId } from '@/services/serverFunctions/emissionFactor'
import { createEmissionSource, updateEmissionSource } from '@/services/serverFunctions/emissionSource'
import { UpdateEmissionSourceCommandValidation } from '@/services/serverFunctions/emissionSource.command'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { EmissionSourceCaracterisation, EmissionSourceType, SubPost, Unit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { InputCategories, InputCategory, InputFormat, Question, QuestionType } from '../services/post'

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
      if (question.importedEmissionFactorId) {
        const result = await getEmissionFactorByImportedId(question.importedEmissionFactorId)
        if (result.success) {
          setEmissionFactor(result.data as EmissionFactorWithMetaData | null)
        }
      }
    }

    fetchEmissionFactor()
  }, [question])

  const unit = useMemo(() => {
    if (!emissionFactor) {
      return null
    }
    return emissionFactor.unit === Unit.CUSTOM ? emissionFactor.customUnit : emissionFactor.unit
  }, [emissionFactor])

  const handleUpdate = useCallback(
    async (emissionSourceId?: string | null) => {
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
    },
    [
      currentValue,
      question.key,
      tEmissionSource,
      subPost,
      study.id,
      studySite,
      emissionFactor?.id,
      tCutQuestions,
      callback,
    ],
  )

  const getTextInput = useCallback(() => {
    if (!question.format) {
      return
    }

    switch (InputCategories[question.format]) {
      case InputCategory.Text:
        return (
          <TextUnitInput
            unit={unit}
            format={question.format || InputFormat.Text}
            type={question.type}
            className="grow"
            disabled={isLoading}
            value={currentValue ?? emissionSource?.value?.toString() ?? ''}
            onChange={(value) => !isLoading && setCurrentValue(value)}
            onUpdate={() => handleUpdate(emissionSource?.id)}
            label={tCutQuestions(`format.${question.format || InputFormat.Text}`)}
            helperText={error}
            error={!!error}
          />
        )
      case InputCategory.Time:
        return (
          <TimePickerInput
            label={tCutQuestions(`format.${question.format}`)}
            value={currentValue ?? ''}
            onChange={setCurrentValue}
            onUpdate={() => {
              handleUpdate(emissionSource?.id)
            }}
          />
        )

      default:
        break
    }
  }, [
    currentValue,
    emissionSource?.id,
    emissionSource?.value,
    error,
    handleUpdate,
    isLoading,
    question.format,
    question.type,
    tCutQuestions,
    unit,
  ])

  const getInput = useCallback(() => {
    switch (question.type) {
      case QuestionType.Text:
        return getTextInput()
      case QuestionType.QCM:
        return <QCM question={question} />
      default:
        return <></>
    }
  }, [getTextInput, question])

  return (
    <Block title={tCutQuestions(question.key, { value: question?.value || '' })}>
      <div className="flex mt1">{getInput()}</div>
      {emissionResults && (
        <div className="mt1">
          <p>{`${formatNumber(emissionResults.emission / STUDY_UNIT_VALUES[study.resultsUnit])} ${tResultstUnits(study.resultsUnit)}`}</p>
        </div>
      )}
    </Block>
  )
}

export default SubPostField
