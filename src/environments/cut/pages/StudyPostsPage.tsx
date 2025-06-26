import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import Stepper from '@/components/base/Stepper'
import TabsWithGreenStyling from '@/components/dynamic-form/TabsWithGreenStyling'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import CheckIcon from '@mui/icons-material/Check'
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import DynamicSubPostForm from '../study/DynamicSubPostForm'

interface Props {
  post: Post
  study: FullStudy
  studySiteId: string
}

const StudyPostsPageCut = ({ post, study, studySiteId }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const router = useRouter()
  const searchParams = useSearchParams()
  const subPosts = useMemo(() => subPostsByPost[post], [post])
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const subPostParam = searchParams.get('subPost')
    if (subPostParam) {
      const subPostIndex = subPosts.findIndex((subPost) => subPost === subPostParam)
      if (subPostIndex !== -1) {
        setActiveStep(subPostIndex)
      }
    }
  }, [searchParams, subPosts])

  useEffect(() => {
    const currentSubPost = subPosts[activeStep]
    if (currentSubPost) {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.set('subPost', currentSubPost)
      const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`
      window.history.replaceState(null, '', newUrl)
    }
  }, [activeStep, subPosts, searchParams])

  const tabContent = useMemo(() => {
    return subPosts.map((subPost) => (
      <DynamicSubPostForm key={subPost} subPost={subPost} study={study} studySiteId={studySiteId} />
    ))
  }, [subPosts, study])

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
    <Block title={tPost(post)} as="h1">
      <TabsWithGreenStyling
        tabs={subPosts}
        t={tPost}
        content={tabContent}
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
            {isLastStep ? tCutQuestions('finish') : tCutQuestions('next')}
          </Button>
        }
        backButton={
          <Button startIcon={<ArrowLeftIcon />} onClick={handlePreviousStep} disabled={isFirstStep} variant="contained">
            {tCutQuestions('previous')}
          </Button>
        }
      />
    </Block>
  )
}

export default StudyPostsPageCut
