import HelpIcon from '@/components/base/HelpIcon'
import { FormDatePicker } from '@/components/form/DatePicker'

import Block from '@/components/base/Block'
import IconLabel from '@/components/base/IconLabel'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { FullStudy } from '@/db/study'
import NewStudyForm from '@/environments/base/study/new/Form'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { Export, Level } from '@prisma/client'
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
  const tLabel = useTranslations('common.label')
  const t = useTranslations('study.new')
  const tGlossary = useTranslations('study.new.glossary')
  const [glossary, setGlossary] = useState('')

  useEffect(() => {
    if (simplified) {
      form.setValue('level', Level.Initial)
      form.setValue('exports', {
        [Export.Beges]: false,
        [Export.GHGP]: false,
        [Export.ISO14069]: false,
      })
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

  const Help = (name: string) => (
    <HelpIcon className="ml-4" onClick={() => setGlossary(name)} label={tGlossary('title')} />
  )

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm
        form={form}
        glossary={glossary}
        setGlossary={setGlossary}
        t={t}
        duplicateStudyId={duplicateStudyId}
      >
        <div>
          <IconLabel icon={Help('realizationDates')} iconPosition="after" className="mb-2">
            <span className="inputLabel bold">{t('realizationDates')}</span>
          </IconLabel>
          <div className="flex gapped1">
            <FormDatePicker
              control={form.control}
              translation={t}
              name="realizationStartDate"
              label={tLabel('start')}
              clearable
            />
            <FormDatePicker
              control={form.control}
              translation={t}
              name="realizationEndDate"
              label={tLabel('end')}
              data-testid="new-study-realizationEndDate"
              clearable
            />
          </div>
        </div>
      </GlobalNewStudyForm>
    </Block>
  )
}

export default NewStudyFormTilt
