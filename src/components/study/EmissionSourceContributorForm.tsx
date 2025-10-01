'use client'

import { StudyWithoutDetail } from '@/services/permissions/study'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { qualityKeys } from '@/services/uncertainty'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber } from '@/utils/number'
import { hasDeprecationPeriod } from '@/utils/study'
import AddIcon from '@mui/icons-material/Add'
import { TextField } from '@mui/material'
import { Environment, StudyResultUnit, SubPost, Unit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useState } from 'react'
import { Path } from 'react-hook-form'
import LinkButton from '../base/LinkButton'
import GlossaryModal from '../modals/GlossaryModal'
import styles from './EmissionSource.module.css'
import EmissionSourceFactor from './EmissionSourceFactor'
import QualitySelectGroup from './QualitySelectGroup'

interface Props {
  emissionSource: StudyWithoutDetail['emissionSources'][0]
  emissionFactors: EmissionFactorWithMetaData[]
  selectedFactor?: EmissionFactorWithMetaData
  subPost: SubPost
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean | null) => void
  isFromOldImport: boolean
  currentBEVersion: string
  advanced: boolean
  environment: Environment | undefined
}

const getDetail = (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) =>
  [metadata.attribute, metadata.comment, metadata.location].filter(Boolean).join(' - ')

const EmissionSourceContributorForm = ({
  emissionSource,
  emissionFactors,
  subPost,
  selectedFactor,
  update,
  isFromOldImport,
  currentBEVersion,
  advanced,
  environment,
}: Props) => {
  const t = useTranslations('emissionSource')
  const tResultUnits = useTranslations('study.results.units')
  const tUnits = useTranslations('units')
  const tGlossary = useTranslations('emissionSource.glossary')
  const [expandedQuality, setExpandedQuality] = useState(!!advanced)
  const [glossary, setGlossary] = useState('')

  const qualities = qualityKeys.map((column) => emissionSource[column])
  const defaultQuality = qualities.find((quality) => quality)
  const canShrink = !defaultQuality || qualities.every((quality) => quality === defaultQuality)

  return (
    <>
      <div className={classNames(styles.row, 'flex')}>
        <EmissionSourceFactor
          canEdit={!emissionSource.validated}
          update={update}
          emissionFactors={emissionFactors}
          subPost={subPost}
          selectedFactor={selectedFactor}
          getDetail={getDetail}
          isFromOldImport={isFromOldImport}
          currentBEVersion={currentBEVersion}
        />
        <div className="grow flex gapped">
          <div className={classNames(styles.inputWithUnit, 'flex grow')}>
            <TextField
              disabled={!!emissionSource.validated}
              className="grow"
              type="number"
              data-testid="emission-source-value-da"
              defaultValue={emissionSource.value}
              onBlur={(event) => update('value', Number(event.target.value))}
              label={`${t('form.value')} *`}
              slotProps={{ input: { onWheel: (event) => (event.target as HTMLInputElement).blur() } }}
            />
            {selectedFactor && (
              <div className={styles.unit}>
                {selectedFactor.unit === Unit.CUSTOM ? selectedFactor.customUnit : tUnits(selectedFactor.unit || '')}
              </div>
            )}
          </div>
          {hasDeprecationPeriod(emissionSource.subPost) && (
            <div className={classNames(styles.inputWithUnit, 'flex grow')}>
              <TextField
                disabled={!!emissionSource.validated}
                className="grow"
                type="number"
                defaultValue={emissionSource.depreciationPeriod}
                onBlur={(event) => update('depreciationPeriod', Number(event.target.value))}
                label={`${t('form.depreciationPeriod')} *`}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
              />
              <div className={styles.unit}>{t('form.years')}</div>
            </div>
          )}
        </div>
        <TextField
          disabled={!!emissionSource.validated}
          data-testid="emission-source-source"
          defaultValue={emissionSource.source}
          onBlur={(event) => update('source', event.target.value)}
          label={t('form.source')}
        />
      </div>
      {selectedFactor ? (
        <div className={styles.row} data-testid="emission-source-factor">
          <p className={styles.header}>
            {selectedFactor.metaData?.title}
            {selectedFactor.location ? ` - ${selectedFactor.location}` : ''}
            {selectedFactor.metaData?.location ? ` - ${selectedFactor.metaData.location}` : ''} -{' '}
            {formatEmissionFactorNumber(getEmissionFactorValue(selectedFactor, environment))}
            {tResultUnits(StudyResultUnit.K)}/
            {selectedFactor.unit === Unit.CUSTOM ? selectedFactor.customUnit : tUnits(selectedFactor.unit || '')}
          </p>
          {selectedFactor.metaData && <p className={styles.detail}>{getDetail(selectedFactor.metaData)}</p>}
        </div>
      ) : (
        <LinkButton color="secondary" href="/facteurs-d-emission/creer" className="mt-2">
          <AddIcon />
          {t('createEmissionFactor')}
        </LinkButton>
      )}
      <div className="mt1">
        <QualitySelectGroup
          canEdit={!emissionSource.validated}
          emissionSource={emissionSource}
          update={update}
          advanced={advanced}
          setGlossary={setGlossary}
          expanded={expandedQuality || !canShrink}
          setExpanded={setExpandedQuality}
          canShrink={canShrink}
          defaultQuality={defaultQuality}
          clearable
        />
      </div>

      {glossary && (
        <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="emission-source" t={tGlossary}>
          <p className="mb-2">
            {tGlossary.rich(`${glossary}Description`, {
              link: (children) => (
                <Link
                  href="https://www.bilancarbone-methode.com/4-comptabilisation/4.4-methode-destimation-des-incertitudes/4.4.2-comment-les-determiner#determination-qualitative"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {children}
                </Link>
              ),
              bcVersion: currentBEVersion,
            })}
          </p>
        </GlossaryModal>
      )}
    </>
  )
}

export default EmissionSourceContributorForm
