'use client'

import Block from '@/components/base/Block'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { getOrganizationUsers } from '@/db/organization'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  user: User
  users: Awaited<ReturnType<typeof getOrganizationUsers>>
  form: UseFormReturn<CreateStudyCommand>
}

const NewStudyForm = ({ user, users, form }: Props) => {
  const t = useTranslations('study.new')

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm user={user} users={users} form={form} />
    </Block>
  )
}

export default NewStudyForm
