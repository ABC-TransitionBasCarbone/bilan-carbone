'use client'

import Block from '@/components/base/Block'
import Stepper from '@/components/base/Stepper'
import TabsWithGreenStyling from '@/components/dynamic-form/TabsWithGreenStyling'
import { FullStudy } from '@/db/study'
import { SUBPOSTS_PUBLICODE_FROM_ENV } from '@/environments/core/publicodes/subposts'
import { PublicodesFormProvider } from '@/lib/publicodes/context'
import { Post, subPostsByPost } from '@/services/posts'
import { SimplifiedEnvironment } from '@/services/publicodes/simplifiedPublicodesConfig'
import CheckIcon from '@mui/icons-material/Check'
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers'
import { SubPost } from  '@repo/db-common/enums'
import { Button } from '@repo/ui'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import PublicodesSubPostForm from '../study/PublicodesSubPostForm'
import SaveStatusIndicator from '../study/SaveStatusIndicator'
import RealTimeResults from './RealTimeResults'

interface Props {
  environment: SimplifiedEnvironment
  post: Post
  currentSubPost: SubPost | undefined
  study: FullStudy
  studySiteId: string
}

const SimplifiedStudyPostsPage = ({ environment, post, currentSubPost, study, studySiteId }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tStudyQuestions = useTranslations('study.questions')
  const tInfography = useTranslations('study.infography')
  const router = useRouter()
  const searchParams = useSearchParams()
  const subPosts = useMemo(
    () => subPostsByPost[post].filter((subPost) => SUBPOSTS_PUBLICODE_FROM_ENV[environment]?.includes(subPost)),
    [post, environment],
  )

  const initialStep = useMemo(() => {
    if (currentSubPost) {
      const index = subPosts.findIndex((subPost) => subPost === currentSubPost)
      return index !== -1 ? index : 0
    }
    return 0
  }, [currentSubPost, subPosts])

  const [activeStep, setActiveStep] = useState(initialStep)

  const activeSubPost = subPosts[activeStep]

  useEffect(() => {
    if (activeSubPost) {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.set('subPost', activeSubPost)
      const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`
      window.history.replaceState(null, '', newUrl)
    }
  }, [activeSubPost, searchParams])

  const handleNextStep = () => {
    if (activeStep < subPosts.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const handleFinish = () => {
    router.push(`/etudes/${study.id}/comptabilisation/saisie-des-donnees/`)
  }

  const isFirstStep = activeStep === 0
  const isLastStep = activeStep >= subPosts.length - 1

  return (
    <PublicodesFormProvider environment={environment} studyId={study.id} studySiteId={studySiteId}>
      <Block
        title={tPost(post)}
        as="h1"
        actions={[
          {
            actionType: 'link',
            href: `/etudes/${study.id}/comptabilisation/saisie-des-donnees`,
            children: tInfography('form.backToInfography'),
          },
        ]}
      >
        <SaveStatusIndicator />

        <TabsWithGreenStyling
          tabs={subPosts}
          t={tPost}
          content={<PublicodesSubPostForm subPost={activeSubPost} />}
          activeTab={activeStep}
          setActiveTab={setActiveStep}
        />

        <Stepper
          steps={subPosts.length}
          activeStep={activeStep + 1}
          fillValidatedSteps={false}
          nextButton={
            <Button
              endIcon={isLastStep ? <CheckIcon /> : <ArrowRightIcon />}
              onClick={isLastStep ? handleFinish : handleNextStep}
              disabled={false}
              variant="contained"
            >
              {isLastStep ? tStudyQuestions('finish') : tStudyQuestions('next')}
            </Button>
          }
          backButton={
            <Button
              startIcon={<ArrowLeftIcon />}
              onClick={handlePreviousStep}
              disabled={isFirstStep}
              variant="contained"
            >
              {tStudyQuestions('previous')}
            </Button>
          }
        />
      </Block>
      <RealTimeResults study={study} studySiteId={studySiteId} post={post} />
    </PublicodesFormProvider>
  )
}

export default SimplifiedStudyPostsPage
