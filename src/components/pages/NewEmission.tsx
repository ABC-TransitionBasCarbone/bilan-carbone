import { useTranslations } from 'next-intl'
import React from 'react'
import NewEmissionForm from '../emission/new/Form'
import Block from '../base/Block'

const NewEmissionPage = () => {
  const t = useTranslations('emissions.create')
  return (
    <Block title={t('title')} as="h1">
      <NewEmissionForm />
    </Block>
  )
}

export default NewEmissionPage
