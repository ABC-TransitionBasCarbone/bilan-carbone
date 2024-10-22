import { useTranslations } from 'next-intl'
import React from 'react'
import NewEmissionForm from '../emission/new/Form'

const NewEmissionPage = () => {
  const t = useTranslations('emissions.create')
  return (
    <>
      <h1>{t('title')}</h1>
      <NewEmissionForm></NewEmissionForm>
    </>
  )
}

export default NewEmissionPage
