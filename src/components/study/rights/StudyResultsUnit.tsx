'use client'

import { FormSelect } from '@/components/form/Select'
import { FullStudy } from '@/db/study'
import { changeStudyResultsUnit } from '@/services/serverFunctions/study'
import {
  ChangeStudyResultsUnitCommand,
  ChangeStudyResultsUnitCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { StudyResultUnit } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyParams.module.css'

interface Props {
  study: FullStudy
  disabled: boolean
}

const StudyResultsUnit = ({ study, disabled }: Props) => {
  const t = useTranslations('study.new')
  const tUnits = useTranslations('study.results.units')
  const [error, setError] = useState('')

  const form = useForm<ChangeStudyResultsUnitCommand>({
    resolver: zodResolver(ChangeStudyResultsUnitCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      resultsUnit: study.resultsUnit,
    },
  })

  const resultsUnit = form.watch('resultsUnit')

  const onSubmit = async (command: ChangeStudyResultsUnitCommand) => {
    const result = await changeStudyResultsUnit(command)
    if (result) {
      setError(result)
    }
  }

  useEffect(() => {
    if (resultsUnit !== study.resultsUnit) {
      onSubmit(form.getValues())
    }
  }, [resultsUnit, form, study])

  return (
    <div className="grow">
      <FormSelect
        className={styles.select}
        control={form.control}
        translation={t}
        name="resultsUnit"
        label={t('resultsUnit')}
        data-testid="study-resultsUnit"
        disabled={disabled}
      >
        {Object.values(StudyResultUnit).map((unit) => (
          <MenuItem key={unit} value={unit}>
            {tUnits(unit)}
          </MenuItem>
        ))}
      </FormSelect>
      {error && <p>{error}</p>}
    </div>
  )
}

export default StudyResultsUnit
