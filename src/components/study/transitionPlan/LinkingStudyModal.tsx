import Form from '@/components/base/Form'
import LoadingButton from '@/components/base/LoadingButton'
import { Select } from '@/components/base/Select'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getStudyPreviousOccurrences } from '@/services/serverFunctions/study'
import { addExternalStudy, linkOldStudy, updateExternalStudy } from '@/services/serverFunctions/transitionPlan'
import {
  createExternalStudyCommandValidation,
  ExternalStudyFormInput,
} from '@/services/serverFunctions/transitionPlan.command'
import { convertValue } from '@/utils/study'
import { PastStudy } from '@/utils/trajectory'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import textUnitStyles from '../../dynamic-form/inputFields/TextUnitInput.module.css'
import styles from './LinkedStudies.module.css'

type PastStudyType = PastStudy['type']

interface Props {
  transitionPlanId: string
  studyId: string
  studyYear: Date
  studyUnit: StudyResultUnit
  open: boolean
  onClose: () => void
  pastStudyToUpdate: PastStudy | null
  linkedStudyIds?: string[]
}

const LinkingStudyModal = ({
  transitionPlanId,
  studyId,
  studyYear,
  studyUnit,
  open,
  onClose,
  pastStudyToUpdate,
  linkedStudyIds = [],
}: Props) => {
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('study.transitionPlan.trajectories.linkedStudies')
  const tUnit = useTranslations('study.results.units')
  const [linking, setLinking] = useState(false)
  const [source, setSource] = useState<PastStudyType>(pastStudyToUpdate?.type ?? 'linked')
  const [oldSource, setOldSource] = useState('')
  const [studies, setStudies] = useState<Pick<FullStudy, 'id' | 'name'>[] | null>(null)

  const currentStudyYear = studyYear.getFullYear()
  const previousYear = new Date(currentStudyYear, 0, 1)
  previousYear.setFullYear(previousYear.getFullYear() - 1)

  const router = useRouter()

  const { control, formState, getValues, reset, handleSubmit } = useForm<ExternalStudyFormInput>({
    resolver: zodResolver(createExternalStudyCommandValidation(currentStudyYear)),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: pastStudyToUpdate
      ? {
          transitionPlanId,
          externalStudyId: pastStudyToUpdate.id,
          name: pastStudyToUpdate.name,
          date: new Date(pastStudyToUpdate.year, 0, 1),
          totalCo2Kg: pastStudyToUpdate.totalCo2,
        }
      : {
          transitionPlanId,
        },
  })

  useEffect(() => {
    const fetchStudies = async () => {
      const res = await getStudyPreviousOccurrences(studyId)
      if (res.success) {
        const filteredStudies = res.data.filter((study) => !linkedStudyIds.includes(study.id))
        setStudies(filteredStudies)
      }
    }
    if (studies === null) {
      fetchStudies()
    }
  }, [studyId, studies, linkedStudyIds])

  const linkOldBCStudy = async () => {
    setLinking(true)
    await callServerFunction(() => linkOldStudy(transitionPlanId, oldSource), {
      onSuccess: () => {
        router.refresh()
        setOldSource('')
        onClose()
      },
      getErrorMessage: (errorMessage) => t(errorMessage),
    })
    setLinking(false)
  }

  const linkExternalStudy = async () => {
    const { totalCo2Kg: totalCo2InStudyUnit, date, ...rest } = getValues()
    const totalCo2Kg = convertValue(totalCo2InStudyUnit, studyUnit, StudyResultUnit.K)

    const data = {
      ...rest,
      date: date instanceof Date ? date.toISOString() : date,
      totalCo2Kg,
    }

    if (pastStudyToUpdate) {
      await callServerFunction(() => updateExternalStudy(data), {
        onSuccess: () => {
          router.refresh()
          reset()
          onClose()
        },
        getErrorMessage: (errorMessage) => t(errorMessage),
      })
    } else {
      await callServerFunction(() => addExternalStudy(data), {
        onSuccess: () => {
          router.refresh()
          reset()
          onClose()
        },
        getErrorMessage: (errorMessage) => t(errorMessage),
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="linking-study"
      title={pastStudyToUpdate ? t('editStudy') : t('linkStudy')}
    >
      {!pastStudyToUpdate && (
        <Select
          label={t('source')}
          t={t}
          value={source}
          onChange={(event) => setSource(event.target.value as PastStudyType)}
          labelId="select-linked-study-source"
          withLabel
        >
          <MenuItem value="linked">{t('oldStudy')}</MenuItem>
          <MenuItem value="external">{t('externalStudy')}</MenuItem>
        </Select>
      )}
      <div className={!pastStudyToUpdate ? 'mt1' : ''}>
        {source === 'linked' && !pastStudyToUpdate ? (
          <>
            <Select
              label={t('study')}
              t={t}
              value={oldSource}
              onChange={(event) => setOldSource(event.target.value as string)}
              labelId="select-linked-old-study-source"
              withLabel
              fullWidth
              disabled={!studies || studies.length === 0}
              displayEmpty={studies && studies.length > 0 ? false : true} // Show placeholder if no studies are available
            >
              {!studies || studies.length === 0 ? (
                <MenuItem value="">{t('noAvailableStudies')}</MenuItem>
              ) : (
                studies.map((study) => (
                  <MenuItem key={study.id} value={study.id}>
                    {study.name}
                  </MenuItem>
                ))
              )}
            </Select>
            <div className="mt1 justify-end">
              <LoadingButton disabled={!oldSource} loading={linking} onClick={linkOldBCStudy}>
                {t('add')}
              </LoadingButton>
            </div>
          </>
        ) : (
          <Form onSubmit={handleSubmit(linkExternalStudy)} className={classNames(styles.form, 'grow justify-center')}>
            <div className="flex-col gapped1">
              <FormTextField
                control={control}
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
                  <FormTextField
                    control={control}
                    name="totalCo2Kg"
                    type="number"
                    className="grow"
                    placeholder={t('totalCo2Placeholder')}
                    slotProps={{
                      htmlInput: { step: '1', min: 0 },
                      input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                    }}
                    fullWidth
                  />
                  <div className={textUnitStyles.unit}>{tUnit(studyUnit)}</div>
                </div>
              </div>
              <div className="mt1 justify-end">
                <LoadingButton type="submit" loading={formState.isSubmitting}>
                  {pastStudyToUpdate ? t('save') : t('add')}
                </LoadingButton>
              </div>
            </div>
          </Form>
        )}
      </div>
    </Modal>
  )
}

export default LinkingStudyModal
