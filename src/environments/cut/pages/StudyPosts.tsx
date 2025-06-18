import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import Stepper from '@/components/base/Stepper'
import Tabs from '@/components/base/Tabs'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { ArrowLeftIcon, ArrowRightIcon } from '@mui/x-date-pickers'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import SubPostTabForm from '../study/SubPostTabForm'

interface Props {
  post: Post
  study: FullStudy
}

const StudyPostsPage = ({ post, study }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tCutQuestions = useTranslations('cutQuestions')
  const subPosts = useMemo(() => subPostsByPost[post], [post])
  const { studySite } = useStudySite(study)
  const [activeStep, setActiveStep] = useState(0)

  const emissionSources = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) => emissionSource.studySite.id === studySite,
      ) as FullStudy['emissionSources'],
    [study, studySite],
  )

  const tabContent = useMemo(() => {
    return subPosts.map((subPost) => (
      <SubPostTabForm
        key={subPost}
        subPost={subPost}
        emissionSources={emissionSources.filter((emissionSource) => emissionSource.subPost === subPost)}
        study={study}
      />
    ))
  }, [subPosts, emissionSources, study])

  return (
    <Block title={tPost(post)} as="h1">
      <Tabs tabs={subPosts} t={tPost} content={tabContent} activeTab={activeStep} setActiveTab={setActiveStep} />
      <Stepper
        steps={subPosts.length}
        activeStep={activeStep + 1}
        fillValidatedSteps
        nextButton={
          <Button
            endIcon={<ArrowRightIcon />}
            onClick={() => setActiveStep(activeStep + 1)}
            disabled={activeStep >= subPosts.length - 1}
          >
            {tCutQuestions('next')}
          </Button>
        }
        backButton={
          <Button
            startIcon={<ArrowLeftIcon />}
            onClick={() => setActiveStep(activeStep - 1)}
            disabled={activeStep === 0}
          >
            {tCutQuestions('previous')}
          </Button>
        }
      />
    </Block>
  )
}

export default StudyPostsPage
