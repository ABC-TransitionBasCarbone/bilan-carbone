import { useTranslations } from 'next-intl'
import React from 'react'
import NewMemberForm from '../team/NewMemberForm'
import Block from '../base/Block'

const NewMemberPage = () => {
  const t = useTranslations('new-member')
  return (
    <Block title={t('title')} as="h1">
      <NewMemberForm />
    </Block>
  )
}

export default NewMemberPage
