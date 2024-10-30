import { useTranslations } from 'next-intl'
import React from 'react'
import Block from '../base/Block'
import NewStudyRightForm from '../study/rights/NewStudyRightForm'
import { StudyWithRights } from '@/db/study'
import { User } from 'next-auth'

interface Props {
  study: StudyWithRights
  user: User
}

const NewStudyRightPage = ({ study, user }: Props) => {
  const t = useTranslations('study.rights.new')
  return (
    <Block title={t('title', { name: study.name })} as="h1">
      <NewStudyRightForm study={study} user={user} />
    </Block>
  )
}

export default NewStudyRightPage
