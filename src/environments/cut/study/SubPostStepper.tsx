import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { caracterisationsBySubPost } from '@/services/emissionSource'
import { createEmissionSource, updateEmissionSource } from '@/services/serverFunctions/emissionSource'
import { UpdateEmissionSourceCommandValidation } from '@/services/serverFunctions/emissionSource.command'
import { TextField } from '@mui/material'
import MobileStepper from '@mui/material/MobileStepper'
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers'
import { SubPost } from '@prisma/client'
import { useEffect, useMemo, useState } from 'react'
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
  const emissionSource = useMemo(
    () => emissionSources?.find((emissionSource) => emissionSource.name === questions[activeStep]?.key),
    [activeStep, emissionSources, questions],
  )
  const { studySite } = useStudySite(study)
  console.log(
    'emissionSources',
    study.emissionSources.filter((emissionSource) => emissionSource.subPost === subPost),
  )

  useEffect(() => {
    if (emissionSource) {
      setCurrentValue(emissionSource?.value?.toString() || '')
    }
  }, [emissionSource])

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
        <Block title={activeQuestion.label}>
          <TextField
            onChange={(e) => setCurrentValue(e.target.value)}
            key={activeQuestion.key}
            type={activeQuestion.type}
            value={currentValue}
          />
        </Block>
      ) : (
        <div>Merci d'avoir répondu aux questions</div>
      )}

      <MobileStepper
        variant="progress"
        steps={questions.length + 1}
        position="static"
        activeStep={activeStep}
        nextButton={
          <Button endIcon={<ArrowRightIcon />} onClick={handleNext} disabled={activeStep >= questions.length}>
            Suivant
          </Button>
        }
        backButton={
          <Button startIcon={<ArrowLeftIcon />} onClick={handleBack} disabled={activeStep === 0}>
            Précédent
          </Button>
        }
      />
    </div>
  )
}

export default SubPostStepper
