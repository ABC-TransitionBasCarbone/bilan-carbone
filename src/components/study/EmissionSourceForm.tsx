'use client'

import { EmissionFactorList } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { getEmissionResults } from '@/services/emissionSource'
import { subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { getTagFamiliesByStudyId } from '@/services/serverFunctions/emissionSource'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { duplicateStudyEmissionSource } from '@/services/serverFunctions/study'
import { EmissionSourcesStatus } from '@/services/study'
import {
  getQualityRating,
  getSpecificEmissionFactorQuality,
  qualityKeys,
  specificFEQualityKeys,
} from '@/services/uncertainty'
import { useUnitLabel } from '@/services/unit'
import { emissionFactorDefautQualityStar, getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { hasDeprecationPeriod, hasEditionRights, isCAS, STUDY_UNIT_VALUES } from '@/utils/study'
import AddIcon from '@mui/icons-material/Add'
import CopyIcon from '@mui/icons-material/ContentCopy'
import EditIcon from '@mui/icons-material/Edit'
import HideIcon from '@mui/icons-material/VisibilityOff'
import { Autocomplete, FormControl, InputLabel, MenuItem, Popper, TextField } from '@mui/material'
import {
  EmissionSourceCaracterisation,
  EmissionSourceType,
  Environment,
  StudyResultUnit,
  StudyRole,
  StudyTag,
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
import TagChip from '../base/TagChip'
import { ImportVersionForFilters } from '../emissionFactor/EmissionFactorsFilters'
import GlossaryModal from '../modals/GlossaryModal'
import Modal from '../modals/Modal'
import DeleteEmissionSource from './DeleteEmissionSource'
import styles from './EmissionSource.module.css'
import EmissionSourceFactor from './EmissionSourceFactor'
import emissionFactorStyles from './EmissionSourceFactor.module.css'
import QualitySelectGroup from './QualitySelectGroup'

type Option = { label: string; value: string; color?: string | null }

const getDetail = (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) =>
  [metadata.attribute, metadata.comment, metadata.location].filter(Boolean).join(' - ')

interface Props {
  studyId: string
  advanced?: boolean
  emissionSource: FullStudy['emissionSources'][0]
  userRoleOnStudy: StudyRole | null
  canEdit: boolean | null
  canValidate: boolean
  canDelete: boolean | null
  subPost: SubPost
  selectedFactor?: FullStudy['emissionSources'][0]['emissionFactor'] & {
    metaData: EmissionFactorList['metaData']
  }
  environment: Environment
  caracterisations: EmissionSourceCaracterisation[]
  mandatoryCaracterisation: boolean
  status: EmissionSourcesStatus
  studySites: FullStudy['sites']
  isFromOldImport: boolean
  currentBEVersion: string
  studyUnit: StudyResultUnit
  userOrganizationId?: string
  emissionFactorsForSubPost: EmissionFactorWithMetaData[]
  importVersions: ImportVersionForFilters[]
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean | null | string[]) => void
}

const EmissionSourceForm = ({
  studyId,
  advanced,
  emissionSource,
  userRoleOnStudy,
  canEdit,
  canValidate,
  canDelete,
  subPost,
  selectedFactor,
  caracterisations,
  mandatoryCaracterisation,
  status,
  studySites,
  isFromOldImport,
  currentBEVersion,
  studyUnit,
  environment,
  userOrganizationId,
  emissionFactorsForSubPost,
  importVersions,
  update,
}: Props) => {
  const t = useTranslations('emissionSource')
  const tCategorisations = useTranslations('categorisations')
  const tGlossary = useTranslations('emissionSource.glossary')
  const tResultUnits = useTranslations('study.results.units')
  const tQuality = useTranslations('quality')
  const getUnitLabel = useUnitLabel()
  const [glossary, setGlossary] = useState('')
  const [editSpecificQuality, setEditSpecificQuality] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [duplicationSite, setDuplicationSite] = useState(emissionSource.studySite.id)
  const [expandedQuality, setExpandedQuality] = useState(!!advanced)
  const [expandedFEQuality, setExpandedFEQuality] = useState(true)
  const [tags, setTags] = useState<StudyTag[]>([])
  const router = useRouter()

  const qualities = qualityKeys.map((column) => emissionSource[column])
  const specificFEQualities = specificFEQualityKeys.map((column) => emissionSource[column])

  const emissionResults = useMemo(() => getEmissionResults(emissionSource, environment), [emissionSource, environment])

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

  const withDeprecationPeriod = useMemo(
    () => hasDeprecationPeriod(emissionSource.subPost),
    [subPostsByPost, emissionSource.subPost],
  )

  useEffect(() => {
    if (isCas) {
      update('value', (emissionSource.hectare || 0) * (emissionSource.duration || 0))
    }
  }, [emissionSource.hectare, emissionSource.duration, isCas, update])

  useEffect(() => {
    getEmissionSourceTags()
  }, [studyId, subPost])

  const getEmissionSourceTags = async () => {
    const response = await getTagFamiliesByStudyId(studyId)
    if (response.success && response.data) {
      setTags(
        response.data.reduce(
          (tags, family) => tags.concat(family.tags).sort((a, b) => a.name.localeCompare(b.name)),
          [] as StudyTag[],
        ),
      )
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
          <Button
            onClick={() => setOpen(true)}
            title={t('duplicate')}
            aria-label={t('duplicate')}
            color="secondary"
            data-testid="duplicate-emission-source"
          >
            <CopyIcon />
          </Button>
        )}
      </p>
      <div className={classNames(styles.row, 'flex')}>
        <EmissionSourceFactor
          canEdit={canEdit}
          update={update}
          subPost={subPost}
          selectedFactor={selectedFactor}
          getDetail={getDetail}
          isFromOldImport={isFromOldImport}
          currentBEVersion={currentBEVersion}
          userOrganizationId={userOrganizationId}
          emissionFactorsForSubPost={emissionFactorsForSubPost}
          importVersions={importVersions}
          studyId={studyId}
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
                  {selectedFactor.unit === Unit.CUSTOM
                    ? selectedFactor.customUnit
                    : getUnitLabel(selectedFactor.unit || '', emissionSource.value)}
                </div>
              )}
            </div>
            {withDeprecationPeriod && (
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
            {formatEmissionFactorNumber(getEmissionFactorValue(selectedFactor, environment))}
            {tResultUnits(StudyResultUnit.K)}/
            {selectedFactor.unit === Unit.CUSTOM ? selectedFactor.customUnit : getUnitLabel(selectedFactor.unit || '')}{' '}
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
        <div className={classNames(styles.optionnalFields, 'grow flex gapped')}>
          <Autocomplete
            className={styles.tagsContainer}
            multiple
            disabled={!canEdit}
            data-testid="emission-source-tag"
            options={tags
              .filter(
                (tag) => !emissionSource.emissionSourceTags.some((sourceTagLink) => tag.id === sourceTagLink.tag.id),
              )
              .map((tag) => ({ label: tag.name, value: tag.id, color: tag.color }))}
            value={emissionSource.emissionSourceTags.map((emissionSourceTag) => ({
              label: emissionSourceTag.tag.name,
              value: emissionSourceTag.tag.id,
              color: emissionSourceTag.tag.color,
            }))}
            onChange={(_, options: Option[]) => {
              update(
                'emissionSourceTags',
                options.map((tag) => tag.value),
              )
            }}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props

              return (
                <li key={key} {...optionProps}>
                  <TagChip name={option.label} color={option.color} size="small" data-testid="tag-option" />
                </li>
              )
            }}
            slots={{
              popper: (props) => <Popper {...props} placement="bottom-start" />,
            }}
            renderInput={(params) => <TextField {...params} label={t('form.tag')} />}
            renderValue={(value: Option[], getItemProps) => (
              <div className={classNames('flex wrap align-center gapped-2', styles.tagOptions)}>
                {value.map((option: Option, index: number) => {
                  const { key, ...itemProps } = getItemProps({ index })
                  return <TagChip name={option.label} color={option.color} key={key} {...itemProps} />
                })}
              </div>
            )}
          />
          <TextField
            className="grow"
            disabled={!canEdit}
            data-testid="emission-source-source"
            defaultValue={emissionSource.source}
            onBlur={(event) => update('source', event.target.value)}
            label={t('form.source')}
          />
        </div>
        <TextField
          multiline
          className="grow"
          disabled={!canEdit}
          data-testid="emission-source-comment"
          defaultValue={emissionSource.comment}
          onBlur={(event) => update('comment', event.target.value)}
          label={t('form.comment')}
        />
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
        <div
          className={classNames(styles.row, 'flex mr-2 grow justify-start align-end')}
          data-testid="emission-source-result"
        >
          {emissionResults.confidenceInterval && (
            <div className="flex-col">
              <p>{t('results.confiance')}</p>
              <p>
                [{formatNumber(emissionResults.confidenceInterval[0] / STUDY_UNIT_VALUES[studyUnit])};{' '}
                {formatNumber(emissionResults.confidenceInterval[1] / STUDY_UNIT_VALUES[studyUnit])}] ({t('in')}
                {tResultUnits(studyUnit)})
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
        <div className={classNames(styles.button, 'grow justify-end mt1 gapped')}>
          {canDelete && <DeleteEmissionSource emissionSource={emissionSource} />}
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
        <div className="grow justify-end mt1 gapped">
          <Button onClick={() => setOpen(false)}>{t('duplicateDialog.cancel')}</Button>
          <Button onClick={duplicateEmissionSource} data-testid="duplicate-confirm">
            {t('duplicateDialog.confirm')}
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default EmissionSourceForm
