'use client'

import { MultiSelect } from '@/components/base/MultiSelect'
import { FormTextField } from '@/components/form/TextField'
import Modal from '@/components/modals/Modal'
import { FullStudy } from '@/db/study'
import { formatNumber } from '@/utils/number'
import { SiteCAUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import styles from './DuplicateSiteModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  sourceSite: FullStudy['sites'][number]
  study: FullStudy
  canEditOrganization: boolean
  caUnit: SiteCAUnit
  onDuplicate: (data: DuplicateFormData) => void
}

export interface DuplicateFormData {
  fieldsToDuplicate: ('etp' | 'ca' | 'volunteerNumber' | 'beneficiaryNumber' | 'emissionSources')[]
  targetSiteIds: string[]
  newSitesCount: number
}

const DuplicateSiteModal = ({ open, onClose, sourceSite, study, canEditOrganization, caUnit, onDuplicate }: Props) => {
  const tCommon = useTranslations('common')
  const tDuplicate = useTranslations('study.perimeter.duplicate')
  const tSites = useTranslations('organization.sites')
  const tCaUnit = useTranslations('settings.caUnit')
  const environment = study.organizationVersion.environment

  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  const { control, watch, handleSubmit } = useForm<DuplicateFormData>({
    defaultValues: {
      fieldsToDuplicate: ['emissionSources'],
      targetSiteIds: [],
      newSitesCount: 0,
    },
  })

  const formValues = watch()
  const fieldsToDuplicate = useMemo(() => formValues.fieldsToDuplicate, [formValues.fieldsToDuplicate])

  const availableSites = useMemo(
    () => study.sites.filter((site) => site.id !== sourceSite.id),
    [study.sites, sourceSite],
  )

  const siteOptions = useMemo(
    () =>
      availableSites.map((site) => ({
        label: site.site.name,
        value: site.id,
      })),
    [availableSites],
  )

  const emissionSourcesCount = useMemo(
    () => study.emissionSources.filter((es) => es.studySite.id === sourceSite.id).length,
    [study.emissionSources, sourceSite],
  )

  const isValid = useMemo(() => {
    const hasDataSelected = fieldsToDuplicate.length > 0
    const hasTargets = selectedSiteIds.length > 0 || (formValues.newSitesCount ?? 0) > 0
    return hasDataSelected && hasTargets
  }, [fieldsToDuplicate, formValues.newSitesCount, selectedSiteIds])

  const handleSelectAll = () => {
    setSelectAll((prev) => {
      const newSelectAll = !prev
      if (newSelectAll) {
        setSelectedSiteIds(availableSites.map((site) => site.id))
      } else {
        setSelectedSiteIds([])
      }
      return newSelectAll
    })
  }

  const handleSiteSelectionChange = (siteIds: string[]) => {
    setSelectedSiteIds(siteIds)
    setSelectAll(siteIds.length === availableSites.length)
  }

  const onSubmit = (data: DuplicateFormData) => {
    onDuplicate({ ...data, targetSiteIds: selectedSiteIds })
  }

  return (
    <Modal
      open={open}
      label="duplicate-site"
      title={tDuplicate('title', { name: sourceSite.site.name })}
      onClose={onClose}
      actions={[
        { actionType: 'button', onClick: onClose, children: tCommon('cancel') },
        {
          actionType: 'button',
          onClick: handleSubmit(onSubmit),
          children: tCommon('duplicate'),
          disabled: !isValid,
          ['data-testid']: 'duplicate-site-modal-confirm',
        },
      ]}
    >
      <div className={classNames('flex-col gapped1', styles.modalContent)}>
        <p className={styles.sectionDescription}>{tDuplicate('description')}</p>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{tDuplicate('selectInfoTitle')}</h3>
          <div className={'flex-col gapped1'}>
            <label className={classNames('align-center', 'pointer', 'gapped075')}>
              <Controller
                control={control}
                name="fieldsToDuplicate"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value?.includes('emissionSources')}
                    onChange={(e) => {
                      const current = field.value || []
                      if (e.target.checked) {
                        field.onChange([...current, 'emissionSources'])
                      } else {
                        field.onChange(current.filter((f) => f !== 'emissionSources'))
                      }
                    }}
                    data-testid="duplicate-emission-sources"
                  />
                )}
              />
              <span>
                {tDuplicate('emissionSources')} ({emissionSourcesCount})
              </span>
            </label>
            <label className={classNames('align-center', 'pointer', 'gapped075')}>
              <Controller
                control={control}
                name="fieldsToDuplicate"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value?.includes('etp')}
                    onChange={(e) => {
                      const current = field.value || []
                      if (e.target.checked) {
                        field.onChange([...current, 'etp'])
                      } else {
                        field.onChange(current.filter((f) => f !== 'etp'))
                      }
                    }}
                    data-testid="duplicate-etp"
                  />
                )}
              />
              <span>
                {tSites('etp')} ({formatNumber(sourceSite.etp, 2)})
              </span>
            </label>
            <label className={classNames('align-center', 'pointer', 'gapped075')}>
              <Controller
                control={control}
                name="fieldsToDuplicate"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    checked={field.value?.includes('ca')}
                    onChange={(e) => {
                      const current = field.value || []
                      if (e.target.checked) {
                        field.onChange([...current, 'ca'])
                      } else {
                        field.onChange(current.filter((f) => f !== 'ca'))
                      }
                    }}
                    data-testid="duplicate-ca"
                  />
                )}
              />
              <span>
                {tSites('ca', { unit: tCaUnit(caUnit) })} ({formatNumber(sourceSite.ca, 2)})
              </span>
            </label>
            {environment === 'TILT' && (
              <>
                <label className={classNames('align-center', 'pointer', 'gapped075')}>
                  <Controller
                    control={control}
                    name="fieldsToDuplicate"
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value?.includes('volunteerNumber')}
                        onChange={(e) => {
                          const current = field.value || []
                          if (e.target.checked) {
                            field.onChange([...current, 'volunteerNumber'])
                          } else {
                            field.onChange(current.filter((f) => f !== 'volunteerNumber'))
                          }
                        }}
                        data-testid="duplicate-volunteer-number"
                      />
                    )}
                  />
                  <span>
                    {tSites('volunteerNumber')} ({sourceSite.volunteerNumber ?? 0})
                  </span>
                </label>
                <label className={classNames('align-center', 'pointer', 'gapped075')}>
                  <Controller
                    control={control}
                    name="fieldsToDuplicate"
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value?.includes('beneficiaryNumber')}
                        onChange={(e) => {
                          const current = field.value || []
                          if (e.target.checked) {
                            field.onChange([...current, 'beneficiaryNumber'])
                          } else {
                            field.onChange(current.filter((f) => f !== 'beneficiaryNumber'))
                          }
                        }}
                        data-testid="duplicate-beneficiary-number"
                      />
                    )}
                  />
                  <span>
                    {tSites('beneficiaryNumber')} ({sourceSite.beneficiaryNumber ?? 0})
                  </span>
                </label>
              </>
            )}
          </div>
        </div>

        <div className={`${styles.section} ${availableSites.length === 0 ? styles.sectionDisabled : ''}`}>
          <h3 className={styles.sectionTitle}>{tDuplicate('selectSitesTitle')}</h3>
          {availableSites.length === 0 ? (
            <p className={styles.noSitesMessage}>{tDuplicate('noOtherSites')}</p>
          ) : (
            <>
              <button type="button" onClick={handleSelectAll} className={classNames('pointer', styles.selectAllButton)}>
                {selectAll ? tDuplicate('deselectAll') : tDuplicate('selectAll')}
              </button>
              <div className={classNames('w100', styles.multiSelectWrapper)}>
                <MultiSelect
                  name="targetSiteIds"
                  value={selectedSiteIds}
                  onChange={handleSiteSelectionChange}
                  options={siteOptions}
                  placeholder={tDuplicate('selectSitesPlaceholder')}
                />
              </div>
            </>
          )}
        </div>

        {canEditOrganization && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{tDuplicate('createSitesTitle')}</h3>
            <p className={styles.sectionDescription}>{tDuplicate('createSitesDescription')}</p>
            <div className={styles.numberInput}>
              <FormTextField
                control={control}
                name="newSitesCount"
                label={tDuplicate('numberOfSitesToCreate')}
                type="number"
                slotProps={{
                  htmlInput: { type: 'number', min: 0 },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
                data-testid="new-sites-count"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default DuplicateSiteModal
