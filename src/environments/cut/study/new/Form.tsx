'use client'

import Block from '@/components/base/Block'
import GlobalNewStudyForm from '@/components/study/new/Form'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { Export, Level } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  form: UseFormReturn<CreateStudyCommand>
  duplicateStudyId?: string | null
}

const NewStudyForm = ({ form, duplicateStudyId }: Props) => {
  const t = useTranslations('study.new')

  useEffect(() => {
    form.setValue('level', Level.Initial)
    form.setValue('exports', {
      [Export.Beges]: false,
      [Export.GHGP]: false,
      [Export.ISO14069]: false,
    })
  }, [form])

  return (
    <Block title={t('title')} as="h1">
      <GlobalNewStudyForm form={form} t={t} isCut={true} duplicateStudyId={duplicateStudyId} />
    </Block>
  )
}

export default NewStudyForm
