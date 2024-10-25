import { useTranslations } from 'next-intl'
import React from 'react'
import NewMemberForm from '../team/NewMemberForm'

const NewMemberPage = () => {
  const t = useTranslations('new-member')
  return (
    <>
      <h1>{t('title')}</h1>
      <NewMemberForm />
    </>
  )
}

export default NewMemberPage
