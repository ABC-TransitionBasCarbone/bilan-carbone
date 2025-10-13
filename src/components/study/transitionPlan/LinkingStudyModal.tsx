import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import { Select } from '@/components/base/Select'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getStudyPreviousOccurrences } from '@/services/serverFunctions/study'
import { addExternalStudy, linkOldStudy } from '@/services/serverFunctions/transitionPlan'
import { ExternalStudyCommand, ExternalStudyCommandValidation } from '@/services/serverFunctions/transitionPlan.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem, TextField } from '@mui/material'
import { StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import textUnitStyles from '../../dynamic-form/inputFields/TextUnitInput.module.css'
import styles from './LinkedStudies.module.css'

type option = 'oldStudy' | 'externalStudy'

interface Props {
  transitionPlanId: string
  studyId: string
  studyYear: Date
  open: boolean
  onClose: () => void
}

const LinkingStudyModal = ({ transitionPlanId, studyId, studyYear, open, onClose }: Props) => {
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('study.transitionPlan.trajectories.linkedStudies')
  const tUnit = useTranslations('study.results.units')
  const [linking, setLinking] = useState(false)
  const [source, setSource] = useState<option>('oldStudy')
  const [oldSource, setOldSource] = useState('')
  const [studies, setStudies] = useState<Pick<FullStudy, 'id' | 'name'>[] | null>(null)

  const previousYear = new Date(studyYear)
  previousYear.setFullYear(previousYear.getFullYear() - 1)

  const router = useRouter()

  const { control, formState, getValues, setValue, reset, handleSubmit } = useForm<ExternalStudyCommand>({
    resolver: zodResolver(ExternalStudyCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      transitionPlanId,
    },
  })

  useEffect(() => {
    const fetchStudies = async () => {
      const res = await getStudyPreviousOccurrences(studyId)
      if (res.success) {
        setStudies(res.data)
      }
    }
    if (studies === null) {
      fetchStudies()
    }
  }, [studyId, studies])

  const linkOldBCStudy = async () => {
    setLinking(true)
    await callServerFunction(() => linkOldStudy(transitionPlanId, oldSource), {
      onSuccess: () => {
        router.refresh()
        setOldSource('')
        onClose()
      },
      getErrorMessage: (errorMessage) => t(errorMessage),
      onError: () => {
        reset()
        onClose()
      },
    })
    setLinking(false)
  }

  const linkExternalStudy = async () => {
    await callServerFunction(() => addExternalStudy(getValues()), {
      onSuccess: () => {
        router.refresh()
      },
      getErrorMessage: (errorMessage) => t(errorMessage),
    })
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} label="linking-study" title={t('linkStudy')}>
      <Select
        label={t('source')}
        t={t}
        value={source}
        onChange={(event) => setSource(event.target.value as option)}
        labelId="select-linked-study-source"
        withLabel
      >
        <MenuItem value="oldStudy">{t('oldStudy')}</MenuItem>
        <MenuItem value="externalStudy">{t('externalStudy')}</MenuItem>
      </Select>
      <div className="mt1">
        {source === 'oldStudy' ? (
          <>
            <Select
              label={t('study')}
              t={t}
              value={oldSource}
              onChange={(event) => setOldSource(event.target.value as string)}
              labelId="select-linked-old-study-source"
              withLabel
              fullWidth
            >
              {studies?.map((study) => (
                <MenuItem key={study.id} value={study.id}>
                  {study.name}
                </MenuItem>
              ))}
            </Select>
            <div className="mt1 justify-end">
              <LoadingButton disabled={!oldSource} loading={linking} onClick={linkOldBCStudy}>
                {t('add')}
              </LoadingButton>
            </div>
          </>
        ) : (
          <Form onSubmit={handleSubmit(linkExternalStudy)} className={classNames(styles.form, 'grow justify-center')}>
            <FormTextField
              control={control}
              translation={t}
              name="name"
              label={`${t('name')} *`}
              placeholder={t('namePlaceholder')}
              data-testid="link-external-study-name"
            />
            <div className="flex-col grow">
              <span className="inputLabel bold mb-2">{`${t('date')} *`}</span>
              <div className="flex grow relative">
                <FormDatePicker
                  control={control}
                  className="grow"
                  translation={t}
                  name="date"
                  views={['year']}
                  maxDate={dayjs(previousYear)}
                  fullWidth
                  data-testid="link-external-study-date"
                />
              </div>
            </div>
            <div className="flex-col grow">
              <span className="inputLabel bold mb-2">{`${t('totalCo2')} *`}</span>
              <div className="flex grow relative">
                <TextField
                  type="number"
                  className="grow"
                  placeholder={t('totalCo2Placeholder')}
                  onBlur={(event) => setValue('totalCo2', Number(event.target.value))}
                  slotProps={{
                    input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                  }}
                />
                <div className={textUnitStyles.unit}>{tUnit(StudyResultUnit.T)}</div>
              </div>
            </div>
            <div className="mt1 justify-end">
              <LoadingButton type="submit" loading={formState.isSubmitting}>
                {t('add')}
              </LoadingButton>
            </div>
          </Form>
        )}
      </div>
    </Modal>
  )
}

export default LinkingStudyModal
