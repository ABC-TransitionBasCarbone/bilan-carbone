'use client'

import Block from '@/components/base/Block'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { Level } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  form: UseFormReturn<CreateStudyCommand>
  duplicateStudyId?: string | null
}

const NewStudyForm = ({ form, duplicateStudyId }: Props) => {
  const t = useTranslations('study.new')
  const [glossary, setGlossary] = useState('')

  const name = form.watch('name')
  const startDate = form.watch('startDate')
  const endDate = form.watch('endDate')

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    // + 1 because january = 0
    const currentMonth = new Date().getMonth() + 1
    const startYear = currentMonth >= 9 ? currentYear : currentYear - 1
    form.setValue('startDate', new Date(`${startYear}-09-01`).toISOString())
    form.setValue('endDate', new Date(`${startYear + 1}-08-31`).toISOString())
    form.setValue('level', Level.Initial)
    form.setValue('exports', [])
  }, [form])

  const beforeSubmit = useCallback(
    (createStudyCommand: CreateStudyCommand) => {
      const startYear = new Date(startDate).getFullYear()
      const endYear = new Date(endDate).getFullYear()

      const newName = `${name} ${startYear}-${endYear}`
      return { ...createStudyCommand, name: newName }
    },
    [form, name, startDate, endDate],
  )

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm
        form={form}
        t={t}
        duplicateStudyId={duplicateStudyId}
        glossary={glossary}
        setGlossary={setGlossary}
        beforeSubmit={beforeSubmit}
      />
    </Block>
  )
}

export default NewStudyForm
