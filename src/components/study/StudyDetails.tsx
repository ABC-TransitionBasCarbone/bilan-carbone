import { FullStudy } from '@/db/study'
import Block from '../base/Block'
import ResultsContainerForStudy from './results/ResultsContainerForStudy'
import StudyDetailsHeader from './StudyDetailsHeader'

interface Props {
  study: FullStudy
}

const StudyDetails = async ({ study }: Props) => {
  return (
    <>
      <StudyDetailsHeader study={study} />
      <Block>
        <ResultsContainerForStudy study={study} />
      </Block>
    </>
  )
}

export default StudyDetails
