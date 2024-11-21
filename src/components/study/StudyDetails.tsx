import { Study } from '@prisma/client'
import Block from '../base/Block'
import PostsInfography from './infography/PostsInfography'

interface Props {
  study: Study
}

const StudyDetails = ({ study }: Props) => {
  return (
    <Block title={study.name} as="h1">
      <PostsInfography study={study} />
    </Block>
  )
}

export default StudyDetails
