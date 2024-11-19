import Block from '@/components/base/Block'
import PostsInfography from '@/components/study/infography/PostsInfography'
import { Study } from '@prisma/client'
import { useTranslations } from 'next-intl'

interface Props {
  study: Study
}

const DataEntry = ({ study }: Props) => {
  const t = useTranslations('study')
  return (
    <Block title={study.name} as="h1">
      <PostsInfography study={study} />
    </Block>
  )
}

export default DataEntry
