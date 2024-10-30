import { Study } from '@prisma/client'
import Block from '../base/Block'
import LinkButton from '../base/LinkButton'
import { useTranslations } from 'next-intl'

interface Props {
  study: Study
}

const StudyDetails = ({ study }: Props) => {
  const t = useTranslations('study')
  return (
    <Block title={study.name} as="h1">
      <LinkButton href={`/etudes/${study.id}/droits`} data-testid="study-rights-button">
        {t('change-rights')}
      </LinkButton>
    </Block>
  )
}

export default StudyDetails
