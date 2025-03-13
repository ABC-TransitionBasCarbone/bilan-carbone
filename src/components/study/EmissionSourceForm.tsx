'use client'
import { FullStudy } from '@/db/study'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { EmissionSourcesStatus } from '@/services/study'
import { getQualityRating } from '@/services/uncertainty'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import AddIcon from '@mui/icons-material/Add'
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { EmissionSourceCaracterisation, EmissionSourceType, SubPost, Unit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Path } from 'react-hook-form'
import Button from '../base/Button'
import HelpIcon from '../base/HelpIcon'
import LinkButton from '../base/LinkButton'
import GlossaryModal from '../modals/GlossaryModal'
import DeleteEmissionSource from './DeleteEmissionSource'
import styles from './EmissionSource.module.css'
import EmissionSourceFactor from './EmissionSourceFactor'
import QualitySelectGroup from './QualitySelectGroup'

const getDetail = (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) =>
  [metadata.attribute, metadata.comment, metadata.location].filter(Boolean).join(' - ')

interface Props {
  advanced?: boolean
  emissionSource: FullStudy['emissionSources'][0]
  canEdit: boolean | null
  canValidate: boolean
  emissionFactors: EmissionFactorWithMetaData[]
  selectedFactor?: EmissionFactorWithMetaData
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean) => void
  caracterisations: EmissionSourceCaracterisation[]
  mandatoryCaracterisation: boolean
  status: EmissionSourcesStatus
}

const EmissionSourceForm = ({
  advanced,
  emissionSource,
  canEdit,
  canValidate,
  update,
  emissionFactors,
  selectedFactor,
  caracterisations,
  mandatoryCaracterisation,
  status,
}: Props) => {
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tCategorisations = useTranslations('categorisations')
  const tGlossary = useTranslations('emissionSource.glossary')
  const tQuality = useTranslations('quality')
  const [glossary, setGlossary] = useState('')
  const [error, setError] = useState('')
  const [expandedQuality, setExpandedQuality] = useState(!!advanced)

  const qualityRating = useMemo(() => (selectedFactor ? getQualityRating(selectedFactor) : null), [selectedFactor])

  const handleUpdate = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (Number(event.target.value) > 0) {
      setError('')
      update('value', Number(event.target.value))
    } else {
      setError(`${t('form.sign')}`)
      event.target.value = ''
    }
  }

  const isCAS =
    emissionSource.subPost === SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas &&
    emissionSource.emissionFactor &&
    emissionSource.emissionFactor.unit === Unit.HA_YEAR

  useEffect(() => {
    if (isCAS) {
      update('value', (emissionSource.hectare || 0) * (emissionSource.duration || 0))
    }
  }, [emissionSource.hectare, emissionSource.duration])

  const glossaryLink = useMemo(() => {
    switch (glossary) {
      case 'type':
        return 'https://www.bilancarbone-methode.com/4-comptabilisation/4.2-methode-de-collecte-des-donnees-dactivite#les-differents-types-de-donnees-dactivite'
      case 'quality':
        return 'https://www.bilancarbone-methode.com/4-comptabilisation/4.4-methode-destimation-des-incertitudes/4.4.2-comment-les-determiner#determination-qualitative'
      default:
        return ''
    }
  }, [glossary])

  return (
    <>
      <p className={classNames(styles.subTitle, 'mt1 mb-2')}>{t('mandartoryFields')}</p>
      <div className={classNames(styles.row, 'flex')}>
        <EmissionSourceFactor
          canEdit={canEdit}
          update={update}
          emissionFactors={emissionFactors}
          selectedFactor={selectedFactor}
          getDetail={getDetail}
        />
        {isCAS ? (
          <div className={classNames(styles.gapped, 'flex')}>
            <TextField
              className="grow"
              disabled={!canEdit}
              type="number"
              defaultValue={emissionSource.hectare}
              onBlur={(event) => update('hectare', Number(event.target.value))}
              label={`${t('form.hectare')} *`}
              slotProps={{
                inputLabel: { shrink: true },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
            />
            <TextField
              className="grow"
              disabled={!canEdit}
              type="number"
              defaultValue={emissionSource.duration}
              onBlur={(event) => update('duration', Number(event.target.value))}
              label={`${t('form.duration')} *`}
              slotProps={{
                inputLabel: { shrink: true },
                input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              }}
            />
          </div>
        ) : (
          <div className={classNames(styles.gapped, 'flex')}>
            <div className={classNames(styles.inputWithUnit, 'flex grow')}>
              <TextField
                className="grow"
                disabled={!canEdit}
                type="number"
                data-testid="emission-source-value-da"
                defaultValue={emissionSource.value}
                onBlur={(event) => handleUpdate(event)}
                label={`${t('form.value')} *`}
                helperText={error}
                error={!!error}
                slotProps={{
                  htmlInput: { min: 0 },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                  inputLabel: { shrink: !!selectedFactor || emissionSource.value !== null },
                }}
              />
              {selectedFactor && <div className={styles.unit}>{tUnits(selectedFactor.unit)}</div>}
            </div>
            {subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost) && (
              <>
                <TextField
                  className="grow"
                  disabled={!canEdit}
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
              </>
            )}
          </div>
        )}
        <FormControl>
          <div className="flex">
            <div className="grow">
              <InputLabel id={'type-label'}>{`${t('form.type')} *`}</InputLabel>
              <Select
                disabled={!canEdit}
                data-testid="emission-source-type"
                value={emissionSource.type || ''}
                onChange={(event) => update('type', event.target.value)}
                label={`${t('form.type')} *`}
                labelId={'type-label'}
                fullWidth
              >
                {Object.keys(EmissionSourceType).map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`type.${value}`)}
                  </MenuItem>
                ))}
              </Select>
            </div>
            <HelpIcon className="ml1" onClick={() => setGlossary('type')} label={tGlossary('title')} />
          </div>
        </FormControl>
      </div>
      {selectedFactor ? (
        <div className={styles.row} data-testid="emission-source-factor">
          <p className={styles.header}>
            {selectedFactor.metaData?.title}
            {selectedFactor.location ? ` - ${selectedFactor.location}` : ''}
            {selectedFactor.metaData?.location ? ` - ${selectedFactor.metaData.location}` : ''} -{' '}
            {getEmissionFactorValue(selectedFactor)} kgCO₂e/
            {tUnits(selectedFactor.unit)}{' '}
            {qualityRating && `- ${tQuality('name')} ${tQuality(qualityRating.toString())}`}
          </p>
          {selectedFactor.metaData && <p className={styles.detail}>{getDetail(selectedFactor.metaData)}</p>}
        </div>
      ) : (
        <LinkButton color="secondary" href="/facteurs-d-emission/creer" className="mt-2">
          <AddIcon />
          {t('createEmissionFactor')}
        </LinkButton>
      )}

      <p className={classNames(styles.subTitle, 'mt1 mb-2')}>{t('optionalFields')}</p>
      <div className={classNames(styles.row, 'flex')}>
        {caracterisations.length > 0 && (
          <FormControl>
            <InputLabel id="emission-source-caracterisation-label">{`${t('form.caracterisation')}${mandatoryCaracterisation ? ' *' : ''}`}</InputLabel>
            <Select
              disabled={!canEdit || caracterisations.length === 1}
              value={emissionSource.caracterisation || ''}
              data-testid="emission-source-caracterisation"
              onChange={(event) => update('caracterisation', event.target.value)}
              labelId="emission-source-caracterisation-label"
              label={`${t('form.caracterisation')}${mandatoryCaracterisation ? ' *' : ''}`}
            >
              {caracterisations.map((categorisation) => (
                <MenuItem key={categorisation} value={categorisation}>
                  {tCategorisations(categorisation)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <TextField
          disabled={!canEdit}
          data-testid="emission-source-source"
          defaultValue={emissionSource.source}
          onBlur={(event) => update('source', event.target.value)}
          label={t('form.source')}
        />
        {!expandedQuality && (
          <QualitySelectGroup
            canEdit={canEdit}
            emissionSource={emissionSource}
            update={update}
            advanced={advanced}
            setGlossary={setGlossary}
            expanded={expandedQuality}
            setExpanded={setExpandedQuality}
          />
        )}
      </div>
      {expandedQuality && (
        <div className={classNames(styles.row, 'flex')}>
          <QualitySelectGroup
            canEdit={canEdit}
            emissionSource={emissionSource}
            update={update}
            advanced={advanced}
            setGlossary={setGlossary}
            expanded={expandedQuality}
            setExpanded={setExpandedQuality}
          />
        </div>
      )}

      <div className={classNames(styles.row, 'flex')}>
        <TextField
          style={{ flex: 2 }}
          disabled={!canEdit}
          data-testid="emission-source-comment"
          defaultValue={emissionSource.comment}
          onBlur={(event) => update('comment', event.target.value)}
          label={t('form.comment')}
        />
      </div>
      <div className={classNames(styles.buttons, 'justify-end mt1 w100')}>
        {canEdit && <DeleteEmissionSource emissionSource={emissionSource} />}
        {canValidate &&
          status !== EmissionSourcesStatus.Waiting &&
          status !== EmissionSourcesStatus.WaitingContributor && (
            <Button
              color={emissionSource.validated ? 'secondary' : 'primary'}
              onClick={() => update('validated', !emissionSource.validated)}
            >
              {t(emissionSource.validated ? 'unvalidate' : 'validate')}
            </Button>
          )}
      </div>
      {glossary && (
        <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="emission-source" t={tGlossary}>
          <p className="mb-2">
            {tGlossary.rich(`${glossary}Description`, {
              link: (children) => (
                <Link href={glossaryLink} target="_blank" rel="noreferrer noopener">
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

export default EmissionSourceForm
