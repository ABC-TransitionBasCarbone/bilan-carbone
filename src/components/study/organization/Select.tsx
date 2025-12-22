'use client'
import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import LinkButton from '@/components/base/LinkButton'
import { FormSelect } from '@/components/form/Select'
import SiteDeselectionWarningModal from '@/components/modals/SiteDeselectionWarningModal'
import { OrganizationWithSites } from '@/db/account'
import DynamicSites from '@/environments/core/organization/DynamicSites'
import { NOT_AUTHORIZED } from '@/services/permissions/check'
import { hasAccessToStudySiteAddAndSelection } from '@/services/permissions/environment'
import { CreateStudyCommand } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { FormHelperText, MenuItem } from '@mui/material'
import { Environment, SiteCAUnit } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface Props {
  user: UserSession
  organizationVersions: OrganizationWithSites[]
  selectOrganizationVersion: Dispatch<SetStateAction<OrganizationWithSites | undefined>>
  form: UseFormReturn<CreateStudyCommand>
  caUnit: SiteCAUnit
  duplicateStudyId?: string | null
  targetOrganizationVersionId?: string | null
}

const SelectOrganization = ({
  user,
  organizationVersions,
  selectOrganizationVersion,
  form,
  caUnit,
  duplicateStudyId,
}: Props) => {
  const t = useTranslations('study.organization')
  const tCommon = useTranslations('common')
  const tOrganizationSites = useTranslations('organization.sites')
  const [error, setError] = useState('')
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [originalSelectedSites, setOriginalSelectedSites] = useState<string[] | null>(null)
  const [pendingDeselectedSites, setPendingDeselectedSites] = useState<
    Array<{ name: string; emissionSourcesCount: number }>
  >([])

  const sites = form.watch('sites')
  const organizationVersionId = form.watch('organizationVersionId')
  const isCut = useMemo(() => user.environment === Environment.CUT, [user.environment])

  const organizationVersion = useMemo(
    () => organizationVersions.find((organizationVersion) => organizationVersion.id === organizationVersionId),
    [organizationVersionId, organizationVersions],
  )

  useEffect(() => {
    if (!organizationVersion) {
      form.setValue('sites', [])
      setOriginalSelectedSites([])
    } else {
      if (!hasAccessToStudySiteAddAndSelection(user.environment)) {
        if (sites.length > 0) {
          form.setValue(
            'sites',
            sites.map((site, index) => ({ ...site, selected: index === 0 })),
          )
          selectOrganizationVersion(organizationVersion)
        } else {
          throw new Error(NOT_AUTHORIZED)
        }
        return
      }
      const newSites = organizationVersion.organization.sites.map((site) => site.id)
      if (JSON.stringify(form.getValues('sites').map((site) => site.id)) !== JSON.stringify(newSites)) {
        form.setValue(
          'sites',
          organizationVersion.organization.sites.map((site) => ({
            ...site,
            ca: site.ca ? displayCA(site.ca, CA_UNIT_VALUES[caUnit]) : 0,
            selected: false,
            postalCode: site.postalCode ?? '',
            city: site.city ?? '',
            cncId: site.cncId ?? '',
            cncCode: site.cnc?.cncCode || '',
          })),
        )
      }
    }
  }, [organizationVersion, caUnit, form])

  useEffect(() => {
    if (!originalSelectedSites && duplicateStudyId && sites.length > 0) {
      const selectedSiteIds = sites.filter((site) => site.selected).map((site) => site.id)
      if (selectedSiteIds.length > 0) {
        setOriginalSelectedSites(selectedSiteIds)
      }
    }
  }, [duplicateStudyId, originalSelectedSites, sites])

  const handleConfirmDeselection = () => {
    setShowWarningModal(false)
    setPendingDeselectedSites([])
    selectOrganizationVersion(organizationVersion)
  }

  const handleCancelDeselection = () => {
    setShowWarningModal(false)
    setPendingDeselectedSites([])
  }

  const next = () => {
    if (!sites.some((site) => site.selected)) {
      setError(t('validation.sites'))
      return
    }

    if (
      user.environment === Environment.CUT &&
      sites
        .filter((site) => site.selected)
        .some(
          (site) =>
            Number.isNaN(site.etp) ||
            (site?.etp && site?.etp <= 0) ||
            Number.isNaN(site.ca) ||
            (site?.ca && site?.ca <= 0),
        )
    ) {
      setError(t('validation.etpCa'))
      return
    }

    // Check for deselected sites with emission sources when duplicating
    if (duplicateStudyId) {
      const currentSelectedSiteIds = sites.filter((site) => site.selected).map((site) => site.id)
      const deselectedSitesWithSources = sites
        .filter((site) => {
          const wasOriginallySelected = originalSelectedSites?.includes(site.id)
          const isCurrentlySelected = currentSelectedSiteIds.includes(site.id)
          const hasEmissionSources = site.emissionSourcesCount && site.emissionSourcesCount > 0

          return wasOriginallySelected && !isCurrentlySelected && hasEmissionSources
        })
        .map((site) => ({
          name: site.name,
          emissionSourcesCount: site.emissionSourcesCount || 0,
        }))

      if (deselectedSitesWithSources.length > 0) {
        setPendingDeselectedSites(deselectedSitesWithSources)
        setShowWarningModal(true)
        return
      }
    }

    selectOrganizationVersion(organizationVersion)
  }

  return (
    <>
      <Block>
        {organizationVersions.length === 1 || duplicateStudyId ? (
          <p data-testid="new-study-organization-title" className="title-h2">
            {duplicateStudyId
              ? organizationVersion?.organization.name
              : !isCut
                ? organizationVersions[0].organization.name
                : tOrganizationSites('title')}
          </p>
        ) : (
          <>
            <p data-testid="new-study-organization-title" className="title-h1">
              {t('title')}
            </p>
            <FormSelect
              data-testid="new-study-organization-select"
              name="organizationVersionId"
              control={form.control}
              translation={t}
              label={t('select')}
            >
              {organizationVersions.map((organizationVersion) => (
                <MenuItem key={organizationVersion.id} value={organizationVersion.id}>
                  {organizationVersion.organization.name}
                </MenuItem>
              ))}
            </FormSelect>
          </>
        )}
        {organizationVersion &&
          (organizationVersion.organization.sites.length > 0 ? (
            <>
              <DynamicSites sites={sites} form={form} caUnit={caUnit} withSelection />
              <div className="mt2">
                <Button
                  disabled={!sites.some((site) => site.selected)}
                  data-testid="new-study-organization-button"
                  onClick={next}
                >
                  {tCommon('next')}
                </Button>
                {error && <FormHelperText error>{error}</FormHelperText>}
              </div>
            </>
          ) : (
            <>
              <p className="title-h3 mt1 mb-2">{t('noSites')}</p>
              <LinkButton href={`/organisations/${organizationVersion.id}/modifier`}>{t('addSite')}</LinkButton>
            </>
          ))}
      </Block>

      <SiteDeselectionWarningModal
        isOpen={showWarningModal}
        onClose={handleCancelDeselection}
        onConfirm={handleConfirmDeselection}
        sitesWithSources={pendingDeselectedSites}
      />
    </>
  )
}

export default SelectOrganization
