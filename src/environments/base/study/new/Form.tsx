'use client'

import Block from '@/components/base/Block'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { getOrganizationAccounts } from '@/db/organization'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  user: UserSession
  accounts: Awaited<ReturnType<typeof getOrganizationAccounts>>
  form: UseFormReturn<CreateStudyCommand>
}

const NewStudyForm = ({ user, accounts, form }: Props) => {
  const t = useTranslations('study.new')

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm user={user} accounts={accounts} form={form} />
    </Block>
  )
}

export default NewStudyForm
