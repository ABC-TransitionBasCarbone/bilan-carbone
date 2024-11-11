'use client'

import { FullStudy } from '@/db/study'
import EditIcon from '@mui/icons-material/Edit'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './EmissionSource.module.css'
import { getEmissionSourceStatus } from '@/services/study'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'
import { TextField } from '@mui/material'
import {
  UpdateEmissionSourceCommand,
  UpdateEmissionSourceCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { updateEmissionSource } from '@/services/serverFunctions/emissionSource'
import { Path } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import EmissionSourceFactor from './EmissionSourceFactor'
import { EmissionWithMetaData } from '@/services/emissions'

interface Props {
  emissions: EmissionWithMetaData[]
  emissionSource: FullStudy['emissionSources'][0]
}

const EmissionSource = ({ emissionSource, emissions }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')

  const router = useRouter()
  const [display, setDisplay] = useState(false)

  const detailId = `${emissionSource.id}-detail`

  const update = useCallback(
    async (key: Path<UpdateEmissionSourceCommand>, value: string | number) => {
      if (key && value) {
        const command = {
          emissionSourceId: emissionSource.id,
          [key]: value,
        }
        const isValid = UpdateEmissionSourceCommandValidation.safeParse(command)
        if (isValid.success) {
          const result = await updateEmissionSource(isValid.data)
          if (!result) {
            router.refresh()
          }
        }
      }
    },
    [emissionSource, router],
  )

  useEffect(() => {
    if (ref.current) {
      if (display) {
        const height = ref.current.scrollHeight
        ref.current.style.height = `${height}px`

        setTimeout(() => {
          if (ref.current) {
            ref.current.style.height = 'auto'
            ref.current.style.overflow = 'visible'
          }
        }, 500)
      } else {
        ref.current.style.height = '0px'
        ref.current.style.overflow = 'hidden'
      }
    }
  }, [display, ref])

  const selectedFactor = useMemo(() => {
    if (emissionSource.emissionFactor) {
      return emissions.find((emission) => emission.id === emissionSource.emissionFactor?.id)
    }
  }, [emissionSource.emissionFactor, emissions])

  return (
    <div className={styles.container}>
      <button
        className={classNames(styles.line, 'justify-between', 'align-center')}
        aria-expanded={display}
        aria-controls={detailId}
        onClick={() => setDisplay(!display)}
      >
        <div>
          <p className={styles.name}>{emissionSource.name}</p>
          <p className={styles.status}>{t(`status.${getEmissionSourceStatus(emissionSource)}`)}</p>
        </div>
        <div>
          <p>
            {emissionSource.value} {selectedFactor && tUnits(selectedFactor.unit)}
          </p>
        </div>
        <div className={styles.editIcon}>
          <EditIcon />
        </div>
      </button>
      <div id={detailId} className={classNames(styles.detail, { [styles.displayed]: display })} ref={ref}>
        {display && (
          <div className={styles.detailContent}>
            <div className={classNames(styles.row, 'flex')}>
              <TextField
                defaultValue={emissionSource.name}
                onBlur={(event) => update('name', event.target.value)}
                label={t('form.name')}
              />
              <TextField
                defaultValue={emissionSource.tag}
                onBlur={(event) => update('tag', event.target.value)}
                label={t('form.tag')}
              />
              <TextField
                defaultValue={emissionSource.caracterisation}
                onBlur={(event) => update('caracterisation', event.target.value)}
                label={t('form.caracterisation')}
              />
            </div>
            <div className={styles.row}>
              <EmissionSourceFactor update={update} emissions={emissions} selectedFactor={selectedFactor} />
            </div>
            <div className={classNames(styles.row, 'flex')}>
              <div className={styles.inputWithUnit}>
                <TextField
                  type="number"
                  defaultValue={emissionSource.value}
                  onBlur={(event) => update('value', Number(event.target.value))}
                  label={t('form.value')}
                />
                {selectedFactor && <div className={styles.unit}>{tUnits(selectedFactor.unit)}</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmissionSource
