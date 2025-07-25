'use client'

import { FullStudy } from '@/db/study'
import { getEmissionResults } from '@/services/emissionSource'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { createEmissionSourceTag, getEmissionSourceTagsByStudyId } from '@/services/serverFunctions/emissionSource'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { duplicateStudyEmissionSource } from '@/services/serverFunctions/study'
import { EmissionSourcesStatus } from '@/services/study'
import {
  getQualityRating,
  getSpecificEmissionFactorQuality,
  qualityKeys,
  specificFEQualityKeys,
} from '@/services/uncertainty'
import { emissionFactorDefautQualityStar, getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { hasEditionRights, isCAS } from '@/utils/study'
import AddIcon from '@mui/icons-material/Add'
import CopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import HideIcon from '@mui/icons-material/VisibilityOff'
import { Autocomplete, createFilterOptions, FormControl, InputLabel, MenuItem, TextField } from '@mui/material'
import {
  EmissionSourceCaracterisation,
  EmissionSourceTag,
  EmissionSourceType,
  StudyResultUnit,
  StudyRole,
  SubPost,
  Unit,
} from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Path } from 'react-hook-form'
import Button from '../base/Button'
import HelpIcon from '../base/HelpIcon'
import LinkButton from '../base/LinkButton'
import { Select } from '../base/Select'
import GlossaryModal from '../modals/GlossaryModal'
import Modal from '../modals/Modal'
import DeleteEmissionSource from './DeleteEmissionSource'
import styles from './EmissionSource.module.css'
import EmissionSourceFactor from './EmissionSourceFactor'
import emissionFactorStyles from './EmissionSourceFactor.module.css'
import QualitySelectGroup from './QualitySelectGroup'

type Option = { label: string; value: string; inputValue?: string }
const filter = createFilterOptions<Option>()

const getDetail = (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) =>
  [metadata.attribute, metadata.comment, metadata.location].filter(Boolean).join(' - ')

interface Props {
  studyId: string
  advanced?: boolean
  emissionSource: FullStudy['emissionSources'][0]
  userRoleOnStudy: StudyRole | null
  canEdit: boolean | null
  canValidate: boolean
  emissionFactors: EmissionFactorWithMetaData[]
  subPost: SubPost
  selectedFactor?: EmissionFactorWithMetaData
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean | null) => void
  caracterisations: EmissionSourceCaracterisation[]
  mandatoryCaracterisation: boolean
  status: EmissionSourcesStatus
  studySites: FullStudy['sites']
  isFromOldImport: boolean
  currentBEVersion: string
  studyUnit: StudyResultUnit
}

const EmissionSourceForm = ({
  studyId,
  advanced,
  emissionSource,
  userRoleOnStudy,
  canEdit,
  canValidate,
  update,
  emissionFactors,
  subPost,
  selectedFactor,
  caracterisations,
  mandatoryCaracterisation,
  status,
  studySites,
  isFromOldImport,
  currentBEVersion,
  studyUnit,
}: Props) => {
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tCategorisations = useTranslations('categorisations')
  const tGlossary = useTranslations('emissionSource.glossary')
  const tResultUnits = useTranslations('study.results.units')
  const tQuality = useTranslations('quality')
  const [glossary, setGlossary] = useState('')
  const [editSpecificQuality, setEditSpecificQuality] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [duplicationSite, setDuplicationSite] = useState(emissionSource.studySite.id)
  const [expandedQuality, setExpandedQuality] = useState(!!advanced)
  const [expandedFEQuality, setExpandedFEQuality] = useState(true)
  const [tags, setTags] = useState<EmissionSourceTag[]>([])
  const [tagInputValue, setTagInputValue] = useState('')
  const router = useRouter()

  const qualities = qualityKeys.map((column) => emissionSource[column])
  const specificFEQualities = specificFEQualityKeys.map((column) => emissionSource[column])

  const emissionResults = useMemo(() => getEmissionResults(emissionSource), [emissionSource])

  const qualityRating = useMemo(
    () => (selectedFactor ? getQualityRating(getSpecificEmissionFactorQuality(emissionSource)) : null),
    [selectedFactor, emissionSource],
  )

  const defaultQuality = qualities.find((quality) => quality)
  const canShrink = !defaultQuality || qualities.every((quality) => quality === defaultQuality)

  const specificFEDefaultQuality = specificFEQualities.find((quality) => quality)
  const canShrinkSpecificFEQuality =
    !specificFEDefaultQuality || specificFEQualities.every((quality) => quality === specificFEDefaultQuality)

  const handleUpdate = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (Number(event.target.value) > 0) {
      setError('')
      update('value', Number(event.target.value))
    } else {
      setError(`${t('form.sign')}`)
      event.target.value = ''
    }
  }

  const isCas = isCAS(emissionSource)

  useEffect(() => {
    if (isCas) {
      update('value', (emissionSource.hectare || 0) * (emissionSource.duration || 0))
    }
  }, [emissionSource.hectare, emissionSource.duration])

  useEffect(() => {
    getEmissionSourceTags()
  }, [studyId])

  const getEmissionSourceTags = async () => {
    const response = await getEmissionSourceTagsByStudyId(studyId)
    if (response.success && response.data) {
      setTags(response.data)
    }
  }

  const createAndUpdateTag = async (name: string) => {
    const createTag = await createEmissionSourceTag({ name, studyId })
    if (createTag.success) {
      update('emissionSourceTagId', createTag.data.id)
      setTags((prevTags) => [...prevTags, createTag.data])
      setTagInputValue(name)
    }
  }

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

  const duplicateEmissionSource = async () => {
    const res = await duplicateStudyEmissionSource(studyId, emissionSource, duplicationSite)
    setOpen(false)
    if (res.success) {
      router.refresh()
    }
  }

  const resetSpecificFEQuality = () => specificFEQualityKeys.forEach((key) => update(key, null))

  return (
    <>
      <p className={classNames(styles.subTitle, 'mt1 mb-2 justify-between')}>
        {t('mandartoryFields')}
        {hasEditionRights(userRoleOnStudy) && (
          <Button onClick={() => setOpen(true)} title={t('duplicate')} aria-label={t('duplicate')} color="secondary">
            <CopyIcon />
          </Button>
        )}
      </p>
      <div className={classNames(styles.row, 'flex')}>
        <EmissionSourceFactor
          canEdit={canEdit}
          update={update}
          emissionFactors={emissionFactors}
          subPost={subPost}
          selectedFactor={selectedFactor}
          getDetail={getDetail}
          isFromOldImport={isFromOldImport}
          currentBEVersion={currentBEVersion}
        />
        {isCas ? (
          <>
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
          </>
        ) : (
          <>
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
              {selectedFactor && (
                <div className={styles.unit}>
                  {selectedFactor.unit === Unit.CUSTOM ? selectedFactor.customUnit : tUnits(selectedFactor.unit || '')}
                </div>
              )}
            </div>
            {subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost) && (
              <div className={classNames(styles.inputWithUnit, 'flex grow')}>
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
              </div>
            )}
          </>
        )}
        <FormControl>
          <div className="flex">
            <div className="grow">
              <InputLabel id={'type-label'}>{`${t('form.type')} *`}</InputLabel>
              <Select
                disabled={!canEdit}
                data-testid="emission-source-type"
                value={emissionSource.type || ''}
                onChange={(event) => update('type', event.target.value === '' ? null : (event.target.value as string))}
                label={`${t('form.type')} *`}
                labelId={'type-label'}
                withLabel={false}
                fullWidth
                clearable
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
        {caracterisations.length > 0 && mandatoryCaracterisation && (
          <FormControl className="grow">
            <InputLabel id="emission-source-caracterisation-label">{`${t('form.caracterisation')} *`}</InputLabel>
            <Select
              disabled={!canEdit || (caracterisations.length === 1 && !!emissionSource.caracterisation)}
              value={emissionSource.caracterisation || ''}
              data-testid="emission-source-caracterisation"
              onChange={(event) =>
                update('caracterisation', event.target.value === '' ? null : (event.target.value as string))
              }
              labelId="emission-source-caracterisation-label"
              label={`${t('form.caracterisation')} *`}
              withLabel={false}
              clearable={!!canEdit && caracterisations.length > 1}
            >
              {caracterisations.map((categorisation) => (
                <MenuItem key={categorisation} value={categorisation}>
                  {tCategorisations(categorisation)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>
      {selectedFactor ? (
        <div className={styles.row} data-testid="emission-source-factor">
          {isFromOldImport && (
            <p className="align-center warning">
              {t('oldVersion')}
              <HelpIcon onClick={() => setGlossary('version')} label={t('information')} />
            </p>
          )}
          <p className={classNames(emissionFactorStyles.header, 'align-end')}>
            {selectedFactor.metaData?.title}
            {selectedFactor.location ? ` - ${selectedFactor.location}` : ''}
            {selectedFactor.metaData?.location ? ` - ${selectedFactor.metaData.location}` : ''} -{' '}
            {formatEmissionFactorNumber(getEmissionFactorValue(selectedFactor))} {tResultUnits(StudyResultUnit.K)}/
            {selectedFactor.unit === Unit.CUSTOM ? selectedFactor.customUnit : tUnits(selectedFactor.unit || '')}{' '}
            {qualityRating && (
              <>
                - {tQuality('name')} {tQuality(qualityRating.toString())}
                {editSpecificQuality ? (
                  <HideIcon
                    className={classNames(styles.editFEQualityButton, 'ml-4')}
                    onClick={() => setEditSpecificQuality(false)}
                  />
                ) : (
                  <EditIcon
                    className={classNames(styles.editFEQualityButton, 'ml-4')}
                    onClick={() => setEditSpecificQuality(true)}
                  />
                )}
              </>
            )}
          </p>
          {selectedFactor.metaData && (
            <p className={emissionFactorStyles.detail}>{getDetail(selectedFactor.metaData)}</p>
          )}
          {editSpecificQuality && (
            <>
              <div className={expandedQuality ? '' : 'mt1'}>
                <QualitySelectGroup
                  canEdit={canEdit}
                  emissionSource={emissionSource}
                  update={update}
                  advanced={advanced}
                  setGlossary={setGlossary}
                  expanded={expandedFEQuality || !canShrinkSpecificFEQuality}
                  setExpanded={setExpandedFEQuality}
                  canShrink={canShrinkSpecificFEQuality}
                  defaultQuality={specificFEDefaultQuality}
                  feSpecific
                  clearable
                />
              </div>
              {canEdit && (
                <p className={classNames(styles.resetFESpecific, 'mt-2')} onClick={resetSpecificFEQuality}>
                  {t('resetFESpecific')}
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <LinkButton color="secondary" href="/facteurs-d-emission/creer" className="mt-2">
          <AddIcon />
          {t('createEmissionFactor')}
        </LinkButton>
      )}

      <p className={classNames(styles.subTitle, 'mt1 mb-2')}>{t('optionalFields')}</p>
      <div className={classNames(styles.row, 'flex', expandedQuality || !canShrink ? 'flex-col' : '')}>
        <Autocomplete
          disabled={!canEdit}
          data-testid="emission-source-tag"
          options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
          inputValue={tagInputValue}
          onInputChange={(_, newInputValue) => setTagInputValue(newInputValue)}
          onChange={(_, option: Option | string | null) => {
            if (option && typeof option === 'object' && 'inputValue' in option && option.inputValue) {
              createAndUpdateTag(option.inputValue)
            } else {
              update('emissionSourceTagId', typeof option === 'string' ? option : option?.value || null)
            }
          }}
          defaultValue={
            emissionSource.emissionSourceTag && {
              label: emissionSource.emissionSourceTag?.name,
              value: emissionSource.emissionSourceTag?.id,
            }
          }
          renderInput={(params) => <TextField {...params} label={t('form.tag')} />}
          freeSolo
          filterOptions={(options, params) => {
            const filtered = filter(options, params)
            const { inputValue } = params
            const isExisting = options.some((option) => inputValue === option.label)
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                value: inputValue,
                label: t('form.create', { tag: inputValue }),
                inputValue,
              })
            }
            return filtered
          }}
        />
        <div className={classNames(styles.gapped, styles.optionnalFields, 'grow flex')}>
          <TextField
            className="grow"
            disabled={!canEdit}
            data-testid="emission-source-source"
            defaultValue={emissionSource.source}
            onBlur={(event) => update('source', event.target.value)}
            label={t('form.source')}
          />
          <TextField
            className="grow"
            disabled={!canEdit}
            data-testid="emission-source-comment"
            defaultValue={emissionSource.comment}
            onBlur={(event) => update('comment', event.target.value)}
            label={t('form.comment')}
          />
        </div>
        <QualitySelectGroup
          canEdit={canEdit}
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
      <div className="flex-row justify-between">
        {emissionResults && (
          <div
            className={classNames(styles.row, 'flex mr-2 grow justify-start align-end')}
            data-testid="emission-source-result"
          >
            {emissionResults.confidenceInterval && (
              <div className="flex-col">
                <p>{t('results.confiance')}</p>
                <p>
                  [{formatNumber(emissionResults.confidenceInterval[0])};{' '}
                  {formatNumber(emissionResults.confidenceInterval[1])}] ({t('in')} {tResultUnits(studyUnit)})
                </p>
              </div>
            )}
            {emissionResults.alpha !== null && (
              <div className={styles.alpha}>
                <p>{t('results.alpha')}</p>
                <p>{formatNumber(emissionResults.alpha * 100, 2)}%</p>
              </div>
            )}
          </div>
        )}
        <div className={classNames(styles.gapped, styles.button, 'grow justify-end mt1')}>
          {canEdit && <DeleteEmissionSource emissionSource={emissionSource} />}
          {canValidate && (
            <Button
              color={emissionSource.validated ? 'secondary' : 'primary'}
              onClick={() => update('validated', !emissionSource.validated)}
              data-testid="emission-source-validate"
              disabled={status === EmissionSourcesStatus.Waiting || status === EmissionSourcesStatus.WaitingContributor}
            >
              {t(emissionSource.validated ? 'unvalidate' : 'validate')}
            </Button>
          )}
        </div>
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
              bcVersion: currentBEVersion,
            })}
          </p>
          {glossary === 'quality' && (
            <p>{tGlossary('specificEmissionFactorQuality', { marker: emissionFactorDefautQualityStar })}</p>
          )}
        </GlossaryModal>
      )}
      <Modal
        open={open}
        title={t('duplicateDialog.title')}
        label="duplicate-emission-source"
        onClose={() => setOpen(false)}
      >
        {t('duplicateDialog.content')}
        {!!studySites.length && <> {t('duplicateDialog.selectSite')}</>}
        <div className="justify-center mt1">
          <Select value={duplicationSite} onChange={(event) => setDuplicationSite(event.target.value as string)}>
            {studySites.map((studySite) => (
              <MenuItem key={`duplication-site-${studySite.id}`} value={studySite.id}>
                {studySite.site.name}
              </MenuItem>
            ))}
          </Select>
        </div>
        <div className={classNames(styles.gapped, 'grow justify-end mt1')}>
          <Button onClick={() => setOpen(false)}>{t('duplicateDialog.cancel')}</Button>
          <Button onClick={duplicateEmissionSource}>{t('duplicateDialog.confirm')}</Button>
        </div>
      </Modal>
    </>
  )
}

export default EmissionSourceForm
