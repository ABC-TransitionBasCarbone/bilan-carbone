'use client'

import Block from '@/components/base/Block'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { Export, Level } from '@prisma/client'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  form: UseFormReturn<CreateStudyCommand>
  duplicateStudyId?: string | null
}

const NewStudyForm = ({ form, duplicateStudyId }: Props) => {
  const t = useTranslations('study.new')
  const [glossary, setGlossary] = useState('')

  useEffect(() => {
    const currentYear = dayjs().year()
    const currentMonth = dayjs().month() + 1
    const startYear = currentMonth >= 9 ? currentYear : currentYear - 1
    form.setValue('startDate', dayjs(`${startYear}-09-01`).toISOString())
    form.setValue('endDate', dayjs(`${startYear + 1}-08-31`).toISOString())
    form.setValue('level', Level.Initial)
    form.setValue('exports', {
      [Export.Beges]: false,
      [Export.GHGP]: false,
      [Export.ISO14069]: false,
    })
  }, [form])

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm
        form={form}
        t={t}
        duplicateStudyId={duplicateStudyId}
        glossary={glossary}
        setGlossary={setGlossary}
      />
    </Block>
  )
}

export default NewStudyForm
