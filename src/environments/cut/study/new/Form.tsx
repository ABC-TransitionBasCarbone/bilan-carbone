'use client'

import Block from '@/components/base/Block'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { Level } from '@prisma/client'
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
    form.setValue('level', Level.Initial)
    form.setValue('exports', [])
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
