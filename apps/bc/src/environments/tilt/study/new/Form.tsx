import GlobalNewStudyForm from '@/components/study/new/Form'
import { getOrganizationVersionAccounts } from '@/db/organization'
import type { FullStudy } from '@/db/study'
import NewStudyForm from '@/environments/base/study/new/Form'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import Block from '@abc-transitionbascarbone/common/components/base/Block'
import type { EmissionFactorImportVersion } from '@abc-transitionbascarbone/common/db'
import { Level } from '@abc-transitionbascarbone/common/db/enums'
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
  canSelectEmissionFactorVersions?: boolean
  emissionFactorVersions?: Pick<EmissionFactorImportVersion, 'id' | 'source' | 'name'>[]
}

const NewStudyFormTilt = ({
  user,
  accounts,
  form,
  duplicateStudyId,
  sourceStudy,
  simplified,
  canSelectEmissionFactorVersions,
  emissionFactorVersions,
}: Props) => {
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
        canSelectEmissionFactorVersions={canSelectEmissionFactorVersions}
        emissionFactorVersions={emissionFactorVersions}
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
        canSelectEmissionFactorVersions={canSelectEmissionFactorVersions}
        emissionFactorVersions={emissionFactorVersions}
        customRouteAfterCreation="/cadrage"
        showStudyDates={false}
      />
    </Block>
  )
}

export default NewStudyFormTilt
