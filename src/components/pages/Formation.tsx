'use server'

import { Formation } from '@prisma/client'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import FormationView from '../formation/Formation'

interface Props {
  formations: Formation[]
  user: User
  organisationName: string
}

const FormationPage = async ({ formations, user, organisationName }: Props) => {
  const t = await getTranslations('formation')
  return (
    <Block title={t('title')}>
      <FormationView formations={formations} user={user} organisationName={organisationName} />
    </Block>
  )
}

export default FormationPage
