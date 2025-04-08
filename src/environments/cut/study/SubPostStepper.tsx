import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import Stepper from '@/components/base/Stepper'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { caracterisationsBySubPost } from '@/services/emissionSource'
import {
  createEmissionSource,
  getEmissionSourcesByStudyId,
  updateEmissionSource,
} from '@/services/serverFunctions/emissionSource'
import { UpdateEmissionSourceCommandValidation } from '@/services/serverFunctions/emissionSource.command'
import { TextField } from '@mui/material'
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { subPostQuestions } from '../services/post'

interface Props {
  subPost: SubPost
  emissionSources?: FullStudy['emissionSources']
  study: FullStudy
}

const SubPostStepper = ({ subPost, emissionSources, study }: Props) => {
  const questions = subPostQuestions[subPost] || []
  const [activeStep, setActiveStep] = useState(0)
  const [currentValue, setCurrentValue] = useState('')
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const { studySite } = useStudySite(study)
  const [emissionSource, setEmissionSource] = useState(
    emissionSources?.find((emissionSource) => emissionSource.name === questions[activeStep]?.key),
  )
  const [isLoading, setIsLoading] = useState(true)

  const refetchEmissionSources = useCallback(async () => {
    const newEmissionSources = await getEmissionSourcesByStudyId(study.id)
    if (newEmissionSources) {
      const emissionSource = newEmissionSources.find(
        (emissionSource) => emissionSource.name === questions[activeStep]?.key,
      )
      console.log('emissionSource', emissionSource)
      setCurrentValue(emissionSource?.value?.toString() || '')
      setEmissionSource(emissionSource)
    }
    setIsLoading(false)
  }, [study, activeStep])

  useEffect(() => {
    console.log('useeffectemission')
    setIsLoading(true)
    refetchEmissionSources()
  }, [activeStep])

  // console.log("emissionsource", emissionSource);

  const caracterisations = useMemo(() => caracterisationsBySubPost[subPost], [subPost])

  const handleNext = async () => {
    const value = parseInt(currentValue)
    const name = questions[activeStep].key

    try {
      if (emissionSource) {
        const command = {
          emissionSourceId: emissionSource.id,
          name,
          value,
        }
        console.log('command', command)

        const isValid = UpdateEmissionSourceCommandValidation.safeParse(command)
        if (isValid.success) {
          console.log('isValid', isValid)

          const res = await updateEmissionSource(isValid.data)
          console.log('res', res)
        }
      } else {
        const result = await createEmissionSource({
          name,
          subPost,
          studyId: study.id,
          studySiteId: studySite,
          caracterisation: caracterisations.length === 1 ? caracterisations[0] : undefined,
        })
        console.log('result', result)
      }
    } catch (error) {
      console.log('error', error)
    } finally {
      setActiveStep((prev) => prev + 1)
      setCurrentValue('')
    }
  }

  const handleBack = () => {
    setCurrentValue('')
    setActiveStep((prev) => prev - 1)
  }

  const activeQuestion = questions[activeStep]

  return (
    <div>
      {activeQuestion ? (
        <Block title={tCutQuestions(activeQuestion.key, { value: activeQuestion?.value || '' })}>
          <TextField
            onChange={(e) => setCurrentValue(e.target.value)}
            key={activeQuestion.key}
            type={activeQuestion.type}
            value={currentValue}
            disabled={isLoading}
          />
        </Block>
      ) : (
        <div>Merci pour vos réponses</div>
      )}
      <Stepper
        steps={questions.length}
        activeStep={activeStep}
        fillValidatedSteps
        nextButton={
          <Button endIcon={<ArrowRightIcon />} onClick={handleNext} disabled={activeStep >= questions.length}>
            {tCutQuestions('next')}
          </Button>
        }
        backButton={
          <Button startIcon={<ArrowLeftIcon />} onClick={handleBack} disabled={activeStep === 0}>
            {tCutQuestions('previous')}
          </Button>
        }
      />
    </div>
  )
}

export default SubPostStepper
