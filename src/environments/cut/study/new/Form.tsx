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
}

const NewStudyForm = ({ form }: Props) => {
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
      <GlobalNewStudyForm form={form} t={t} />
    </Block>
  )
}

export default NewStudyForm
