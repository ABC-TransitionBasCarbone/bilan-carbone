'use client'

import Form from '@/components/base/Form'
import IconLabel from '@/components/base/IconLabel'
import LoadingButton from '@/components/base/LoadingButton'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import StudyDuplicationForm, { InviteOptions } from '@/components/study/duplication/StudyDuplicationForm'
import { useServerFunction } from '@/hooks/useServerFunction'
import { createStudyCommand, duplicateStudyCommand } from '@/services/serverFunctions/study'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import HelpIcon from '../../base/HelpIcon'
import styles from './Form.module.css'

interface Props {
  form: UseFormReturn<CreateStudyCommand>
  children?: React.ReactNode
  glossary?: string
  setGlossary?: (glossary: string) => void
  t: (key: string) => string
  duplicateStudyId?: string | null
  beforeSubmit?: (createStudyCommand: CreateStudyCommand) => CreateStudyCommand
}

const NewStudyForm = ({ form, children, glossary, setGlossary, t, duplicateStudyId, beforeSubmit }: Props) => {
  const router = useRouter()
  const tLabel = useTranslations('common.label')
  const tError = useTranslations('study.new.error')
  const tGlossary = useTranslations('study.new.glossary')
  const tStudyNewSuggestion = useTranslations('study.new.suggestion')
  const { callServerFunction } = useServerFunction()
  const [inviteOptions, setInviteOptions] = useState<InviteOptions>({
    team: true,
    contributors: true,
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (command: CreateStudyCommand) => {
    setLoading(true)
    if (beforeSubmit) {
      command = beforeSubmit(command)
    }
    const serverFunction = duplicateStudyId
      ? () => duplicateStudyCommand(duplicateStudyId, command, inviteOptions.team, inviteOptions.contributors)
      : () => createStudyCommand(command)

    await callServerFunction(() => serverFunction(), {
      onSuccess: (data) => {
        router.push(`/etudes/${data.id}`)
        router.refresh()
      },
      getErrorMessage: (error) => tError(error),
      onError: () => setLoading(false),
    })
  }

  const Help = (name: string) => (
    <HelpIcon className="ml-4" onClick={() => setGlossary && setGlossary(name)} label={tGlossary('title')} />
  )

  const studyNamePlaceHolder = useMemo(
    () =>
      `${
        tStudyNewSuggestion.rich('name', {
          studyStartDate: new Date().getFullYear(),
          orga: form.getValues('sites')[0]?.name || tStudyNewSuggestion('yourOrga'),
        }) || ''
      }`,
    [form, tStudyNewSuggestion],
  )

  return (
    <>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <FormTextField
          data-testid="new-study-name"
          control={form.control}
          name="name"
          label={t('name')}
          placeholder={studyNamePlaceHolder}
        />
        <div>
          <IconLabel icon={Help('studyDates')} iconPosition="after" className="mb-2">
            <span className="inputLabel bold">{t('studyDates')}</span>
          </IconLabel>
          <div className={styles.dates}>
            <FormDatePicker control={form.control} translation={t} name="startDate" label={tLabel('start')} />
            <FormDatePicker
              control={form.control}
              translation={t}
              name="endDate"
              label={tLabel('end')}
              data-testid="new-study-endDate"
            />
          </div>
        </div>
        {children}
        {duplicateStudyId && (
          <StudyDuplicationForm
            setGlossary={setGlossary}
            inviteOptions={inviteOptions}
            setInviteOptions={setInviteOptions}
          />
        )}
        <LoadingButton type="submit" loading={loading} data-testid="new-study-create-button">
          {duplicateStudyId ? t('duplicate') : t('create')}
        </LoadingButton>
      </Form>
      {glossary && (
        <GlossaryModal
          glossary={glossary}
          onClose={() => setGlossary && setGlossary('')}
          label="emission-source"
          t={tGlossary}
        >
          <p className="mb-2">
            {tGlossary.rich(`${glossary}Description`, {
              link: (children) => (
                <Link
                  href="https://www.bilancarbone-methode.com/1-cadrage-de-la-demarche/1.1-definir-son-niveau-de-maturite-bilan-carbone-r"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {children}
                </Link>
              ),
            })}
          </p>
        </GlossaryModal>
      )}
    </>
  )
}

export default NewStudyForm
