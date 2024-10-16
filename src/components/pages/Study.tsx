import { Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import LinkButton from '../base/LinkButton'
import Studies from '../study/Studies'

interface Props {
  studies: Study[]
}

const StudyPage = ({ studies }: Props) => {
  const t = useTranslations('study')
  return (
    <>
      <LinkButton href="/etudes/creer">{t('create')}</LinkButton>
      <Studies studies={studies} />
    </>
  )
}

export default StudyPage
