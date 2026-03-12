import Block from '@/components/base/Block'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { FullStudy } from '@/db/study'
import NewStudyForm from '@/environments/base/study/new/Form'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { Level } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  user: UserSession
  accounts: Awaited<ReturnType<typeof getOrganizationVersionAccounts>>
  form: UseFormReturn<CreateStudyCommand>
  duplicateStudyId?: string | null
  sourceStudy?: FullStudy | null
  simplified?: boolean
}

const NewStudyFormTilt = ({ user, accounts, form, duplicateStudyId, sourceStudy, simplified }: Props) => {
  const t = useTranslations('study.new')
  const [glossary, setGlossary] = useState('')

  useEffect(() => {
    if (simplified) {
      const currentYear = new Date().getFullYear()
      const startYear = currentYear - 1
      form.setValue('startDate', new Date(`${startYear}-01-01`).toISOString())
      form.setValue('endDate', new Date(`${startYear}-12-31`).toISOString())
      form.setValue('level', Level.Initial)
      form.setValue('exports', [])
      form.setValue('simplified', simplified)
    }
  }, [form, simplified])

  if (!simplified) {
    return (
      <NewStudyForm
        user={user}
        accounts={accounts}
        form={form}
        duplicateStudyId={duplicateStudyId}
        sourceStudy={sourceStudy}
      />
    )
  }

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm
        form={form}
        glossary={glossary}
        setGlossary={setGlossary}
        t={t}
        duplicateStudyId={duplicateStudyId}
        customRouteAfterCreation="/cadrage"
        showStudyDates={false}
      />
    </Block>
  )
}

export default NewStudyFormTilt
