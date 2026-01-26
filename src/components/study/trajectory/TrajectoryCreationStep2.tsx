import HelpIcon from '@/components/base/HelpIcon'
import IconLabel from '@/components/base/IconLabel'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { customRich } from '@/i18n/customRich'
import { TrajectoryFormData } from '@/services/serverFunctions/trajectory.command'
import { toTitleCase } from '@/utils/string'
import { BaseObjective, getReductionRatePerType } from '@/utils/trajectory'
import AddIcon from '@mui/icons-material/Add'
import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { TrajectoryType } from '@prisma/client'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { Control, Controller, useFieldArray } from 'react-hook-form'
import ObjectiveCard from './ObjectiveCard'
import styles from './TrajectoryCreationModal.module.css'

interface Props {
  isSBTI: boolean
  isSNBC: boolean
  trajectoryType: TrajectoryType
  control: Control<TrajectoryFormData>
  showTrajectoryTypeSelector: boolean
  handleModeSelect: (type: TrajectoryType) => void
  studyYear: number
  snbcRates: { rateTo2030: number; rateTo2050: number } | null
  correctedObjectives: (BaseObjective | null)[] | null
}

const TrajectoryCreationStep2 = ({
  isSBTI,
  isSNBC,
  trajectoryType,
  control,
  showTrajectoryTypeSelector,
  handleModeSelect,
  studyYear,
  snbcRates,
  correctedObjectives,
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  const tGlossary = useTranslations('study.transitionPlan.trajectoryModal.glossary')
  const [glossary, setGlossary] = useState('')
  const sbtiReductionRate = getReductionRatePerType(trajectoryType)
  const maxReferenceDate = dayjs().year(studyYear)

  const snbcReductionRate2030 = snbcRates?.rateTo2030
  const snbcReductionRate2050 = snbcRates?.rateTo2050

  const rateTo2030 = isSNBC ? snbcReductionRate2030 : isSBTI ? sbtiReductionRate : undefined
  const rateFrom2030To2050 = isSNBC ? snbcReductionRate2050 : isSBTI ? sbtiReductionRate : undefined
  const {
    fields: objectives,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'objectives',
  })

  const getMainTrajectoryType = () => {
    if (trajectoryType === TrajectoryType.SBTI_15 || trajectoryType === TrajectoryType.SBTI_WB2C) {
      return 'SBTI'
    }

    if (trajectoryType === TrajectoryType.SNBC_GENERAL || trajectoryType === TrajectoryType.SNBC_SECTORAL) {
      return 'SNBC'
    }

    return TrajectoryType.CUSTOM
  }

  const handleMainTypeChange = (value: string) => {
    if (value === 'SBTI') {
      handleModeSelect(TrajectoryType.SBTI_15)
    } else if (value === 'SNBC') {
      handleModeSelect(TrajectoryType.SNBC_GENERAL)
    } else {
      handleModeSelect(value as TrajectoryType)
    }
  }

  return (
    <div className="flex-col gapped15">
      {showTrajectoryTypeSelector ? (
        <div>
          <Typography variant="body1" fontWeight={600} className="mb075">
            {t('steps.chooseTrajectory')}
          </Typography>
          <RadioGroup row value={getMainTrajectoryType()} onChange={(e) => handleMainTypeChange(e.target.value)}>
            <FormControlLabel value="SBTI" control={<Radio />} label={t('sbti.title')} />
            <FormControlLabel value="SNBC" control={<Radio />} label={t('snbc.title')} />
            <FormControlLabel
              value={TrajectoryType.CUSTOM}
              control={<Radio />}
              label={toTitleCase(t('custom.title'))}
            />
          </RadioGroup>
        </div>
      ) : (
        <div className={classNames(styles.trajectoryOptionSelected, 'p1 wfit')}>
          <Typography variant="body1" fontWeight={600}>
            {isSBTI || isSNBC ? t(`selectedTrajectory.${trajectoryType}`) : t('selectedTrajectory.CUSTOM')}
          </Typography>
        </div>
      )}

      <FormTextField
        name="name"
        control={control}
        label={t('name')}
        placeholder={t('namePlaceholder')}
        fullWidth
        required
      />

      <FormTextField
        name="description"
        control={control}
        label={t('description')}
        placeholder={t('descriptionPlaceholder')}
        fullWidth
        multiline
      />

      <div>
        {(() => {
          const getReferenceYearGlossaryKey = () => {
            if (isSBTI || isSNBC) {
              return 'referenceYearMethod'
            }
            return 'referenceYear'
          }

          return (
            <IconLabel
              icon={<HelpIcon onClick={() => setGlossary(getReferenceYearGlossaryKey())} label={tGlossary('title')} />}
              iconPosition="after"
              className="mb-2"
            >
              <Typography fontWeight="bold">{t('referenceYear')}</Typography>
            </IconLabel>
          )
        })()}
        <FormDatePicker
          name="referenceYear"
          control={control}
          views={['year']}
          minDate={dayjs('1990-01-01')}
          maxDate={maxReferenceDate}
          clearable
          fullWidth
          disabled={isSBTI || isSNBC}
        />
      </div>

      {isSBTI && (
        <Controller
          name="trajectoryType"
          control={control}
          render={({ field }) => (
            <div>
              <Typography variant="body1" fontWeight={600}>
                {t('sbtiType.title')}
              </Typography>
              <RadioGroup row value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <FormControlLabel value={TrajectoryType.SBTI_15} control={<Radio />} label={t('sbtiType.15')} />
                <FormControlLabel value={TrajectoryType.SBTI_WB2C} control={<Radio />} label={t('sbtiType.wb2c')} />
              </RadioGroup>
            </div>
          )}
        />
      )}

      {isSNBC && (
        <Controller
          name="trajectoryType"
          control={control}
          render={({ field }) => (
            <div>
              <Typography variant="body1" fontWeight={600}>
                {t('snbcType.title')}
              </Typography>
              <RadioGroup row value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <FormControlLabel
                  value={TrajectoryType.SNBC_GENERAL}
                  control={<Radio />}
                  label={t('snbcType.generale')}
                />
                <FormControlLabel
                  value={TrajectoryType.SNBC_SECTORAL}
                  control={<Radio />}
                  label={t('snbcType.sectorielle')}
                  disabled
                />
              </RadioGroup>
            </div>
          )}
        />
      )}

      <div>
        <Typography variant="body1" fontWeight="bold" className="mb1">
          {t('objectives.title')}
        </Typography>
        {isSBTI && (
          <Typography variant="body2" color="textSecondary" className="mb1">
            {customRich(t, 'objectives.sbtiDescription')}
          </Typography>
        )}
        {isSNBC && (
          <Typography variant="body2" color="textSecondary" className="mb1">
            {customRich(t, 'objectives.snbcDescription')}
          </Typography>
        )}

        <div className="wrap gapped15">
          {isSBTI || isSNBC ? (
            <>
              <ObjectiveCard
                name={t('objectives.horizon2030')}
                reductionRate={rateTo2030}
                correctedObjective={correctedObjectives?.[0] || null}
                isEditable={false}
                control={control}
                index={0}
              />

              <ObjectiveCard
                name={t('objectives.horizon2050')}
                reductionRate={rateFrom2030To2050}
                correctedObjective={correctedObjectives?.[1] || null}
                isEditable={false}
                control={control}
                index={1}
              />
            </>
          ) : (
            <>
              {objectives.map((objective, index) => (
                <ObjectiveCard
                  key={objective.id}
                  isEditable
                  correctedObjective={correctedObjectives?.[index] || null}
                  control={control}
                  index={index}
                  onDelete={() => remove(index)}
                />
              ))}

              <div
                onClick={() => append({ targetYear: null, reductionRate: null })}
                className={styles.addObjectiveButton}
              >
                <AddIcon fontSize="large" />
              </div>
            </>
          )}
        </div>
      </div>
      {glossary && (
        <GlossaryModal
          glossary={glossary === 'referenceYearMethod' ? 'referenceYearMethod' : glossary}
          label="trajectory-reference-year"
          t={tGlossary}
          onClose={() => setGlossary('')}
          titleParams={
            glossary === 'referenceYearMethod'
              ? {
                  method: isSBTI ? 'SBTI' : 'SNBC',
                }
              : undefined
          }
        >
          {glossary === 'referenceYearMethod' ? (
            <p>
              {tGlossary('referenceYearMethodDescription', {
                method: isSBTI ? 'SBTI' : 'SNBC',
              })}{' '}
              <Link
                href={isSBTI ? process.env.NEXT_PUBLIC_SBTI_DOC_URL || '' : process.env.NEXT_PUBLIC_SNBC_DOC_URL || ''}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tGlossary('referenceYearMethodLink')}
              </Link>
            </p>
          ) : (
            tGlossary(`${glossary}Description`)
          )}
        </GlossaryModal>
      )}
    </div>
  )
}

export default TrajectoryCreationStep2
