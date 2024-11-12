import { Study } from '@prisma/client'
import Block from '../base/Block'
import { useTranslations } from 'next-intl'
import LinkButton from '../base/LinkButton'
import PostsInfography from './infography/PostsInfography'

interface Props {
  study: Study
}

const StudyDetails = ({ study }: Props) => {
  const t = useTranslations('study')
  return (
    <Block
      title={study.name}
      as="h1"
      link={`/etudes/${study.id}/droits`}
      linkDataTestId="study-rights-button"
      linkLabel={t('change-rights')}
    >
      <LinkButton href={'#'}>{t('tags')}</LinkButton>
      <PostsInfography study={study} />
    </Block>
  )
}

export default StudyDetails
