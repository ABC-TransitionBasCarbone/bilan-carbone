'use server'

import { Formation } from '@prisma/client'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import FormationView from '../formation/Formation'

interface Props {
  formations: Formation[]
  user: User
  organizationName: string
}

const FormationPage = async ({ formations, user, organizationName }: Props) => {
  const t = await getTranslations('formation')
  return (
    <Block title={t('title')}>
      <FormationView formations={formations} user={user} organizationName={organizationName} />
    </Block>
  )
}

export default FormationPage
