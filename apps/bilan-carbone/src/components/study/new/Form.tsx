'use client'

import Form from '@/components/base/Form'
import IconLabel from '@/components/base/IconLabel'
import LoadingButton from '@/components/base/LoadingButton'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import StudyDuplicationForm, { InviteOptions } from '@/components/study/duplication/StudyDuplicationForm'
import { useServerFunction } from '@/hooks/useServerFunction'
import { customRich } from '@/i18n/customRich'
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
  customRouteAfterCreation?: string
  showStudyDates?: boolean
}

const NewStudyForm = ({
  form,
  children,
  glossary,
  setGlossary,
  t,
  duplicateStudyId,
  beforeSubmit,
  customRouteAfterCreation = '',
  showStudyDates = true,
}: Props) => {
  const router = useRouter()
  const tLabel = useTranslations('common.label')
  const tError = useTranslations('study.new.error')
  const tGlossary = useTranslations('study.new.glossary')
  const tStudyNewSuggestion = useTranslations('study.new.suggestion')
  const tDocumentation = useTranslations('documentationUrl')
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
        router.push(`/etudes/${data.id}${customRouteAfterCreation}`)
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
        customRich(tStudyNewSuggestion, 'name', {
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
        {showStudyDates && (
          <div>
            <IconLabel icon={Help('studyDates')} iconPosition="after" className="mb-2">
              <span className="inputLabel bold">{t('studyDates')}</span>
            </IconLabel>
            <div className={styles.dates}>
              <FormDatePicker control={form.control} name="startDate" label={tLabel('start')} />
              <FormDatePicker
                control={form.control}
                name="endDate"
                label={tLabel('end')}
                data-testid="new-study-endDate"
              />
            </div>
          </div>
        )}
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
            {customRich(tGlossary, `${glossary}Description`, {
              link: (children) => (
                <Link href={tDocumentation('maturity')} target="_blank" rel="noreferrer noopener">
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
