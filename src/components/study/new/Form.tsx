'use client'

import Form from '@/components/base/Form'
import IconLabel from '@/components/base/IconLabel'
import LoadingButton from '@/components/base/LoadingButton'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { useServerFunction } from '@/hooks/useServerFunction'
import { createStudyCommand } from '@/services/serverFunctions/study'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UseFormReturn } from 'react-hook-form'
import HelpIcon from '../../base/HelpIcon'
import styles from './Form.module.css'

interface Props {
  form: UseFormReturn<CreateStudyCommand>
  children?: React.ReactNode
  glossary?: string
  setGlossary?: (glossary: string) => void
  t: (key: string) => string
}

const NewStudyForm = ({ form, children, glossary, setGlossary, t }: Props) => {
  const router = useRouter()
  const tError = useTranslations('study.new.error')
  const tGlossary = useTranslations('study.new.glossary')
  const { callServerFunction } = useServerFunction()

  const onSubmit = async (command: CreateStudyCommand) => {
    await callServerFunction(() => createStudyCommand(command), {
      onSuccess: (data) => {
        router.push(`/etudes/${data.id}`)
        router.refresh()
      },
      getErrorMessage: (error) => tError(error),
    })
  }

  const Help = (name: string) => (
    <HelpIcon className="ml-4" onClick={() => setGlossary && setGlossary(name)} label={tGlossary('title')} />
  )

  return (
    <>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <FormTextField
          data-testid="new-study-name"
          control={form.control}
          translation={t}
          name="name"
          label={t('name')}
        />
        <div>
          <IconLabel icon={Help('studyDates')} iconPosition="after" className="mb-2">
            <span className="inputLabel bold">{t('studyDates')}</span>
          </IconLabel>
          <div className={styles.dates}>
            <FormDatePicker control={form.control} translation={t} name="startDate" label={t('start')} />
            <FormDatePicker
              control={form.control}
              translation={t}
              name="endDate"
              label={t('end')}
              data-testid="new-study-endDate"
            />
          </div>
        </div>
        {children}
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="new-study-create-button">
          {t('create')}
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
