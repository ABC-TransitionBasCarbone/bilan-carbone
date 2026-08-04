'use client'

import { OrganizationWithSites } from '@/db/account'
import type { FullStudy } from '@/db/study'
import Sites from '@/environments/base/organization/Sites'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import {
  getUpdateOrganizationVersionPermission,
  updateOrganizationSitesCommand,
} from '@/services/serverFunctions/organization'
import { changeStudySites, duplicateSiteAndEmissionSources, hasActivityData } from '@/services/serverFunctions/study'
import {
  ChangeStudySitesCommand,
  ChangeStudySitesCommandValidation,
  ChangeStudySiteTiltSimplifiedCommand,
  SitesCommand,
} from '@/services/serverFunctions/study.command'
import { TiltStudySiteFields } from '@/services/studySiteToSituation'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { canEditOrganizationVersion, isInOrgaOrParent } from '@/utils/organization'
import { hasEditionRights } from '@/utils/study'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import GlossaryModal from '@abc-transitionbascarbone/components/src/modals/GlossaryModal'
import { Environment, SiteCAUnit, StudyRole } from '@abc-transitionbascarbone/db-common/enums'
import { Button } from '@abc-transitionbascarbone/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useForm, UseFormReturn, useWatch } from 'react-hook-form'
import DeleteStudySiteModal from './DeleteStudySiteModal'
import { DuplicateFormData } from './DuplicateSiteModal'
import ReplicateSitesChangesModal from './ReplicateSitesChangesModal'

const SitesCut = dynamic(() => import('@/environments/cut/organization/Sites'))
const SitesTilt = dynamic(() => import('@/environments/tilt/organization/Sites'))

const DuplicateSiteModal = dynamic(() => import('./DuplicateSiteModal'), { ssr: false })

interface Props {
  study: FullStudy
  organizationVersion: OrganizationWithSites
  userRoleOnStudy: StudyRole
  caUnit: SiteCAUnit
  user: UserSession
  handleSpecificChange?: (
    siteId: string,
    data: ChangeStudySiteTiltSimplifiedCommand & TiltStudySiteFields,
  ) => Promise<void>
}

const StudySites = ({ study, organizationVersion, userRoleOnStudy, caUnit, user, handleSpecificChange }: Props) => {
  const tGlossary = useTranslations('study.new.glossary')
  const t = useTranslations('study.perimeter')
  const [open, setOpen] = useState(false)
  const [glossary, setGlossary] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [replicateSitesChanges, setReplicateSitesChanges] = useState(false)
  const [deleting, setDeleting] = useState(0)
  const [duplicatingSiteId, setDuplicatingSiteId] = useState<string | null>(null)
  const hasEditionRole = useMemo(() => hasEditionRights(userRoleOnStudy), [userRoleOnStudy])
  const isFromStudyOrganizationOrParent = useMemo(
    () =>
      isInOrgaOrParent(user.organizationVersionId, {
        id: study.organizationVersionId,
        parentId: study.organizationVersion.parent?.id || '',
      }),
    [study.organizationVersion.parent?.id, study.organizationVersionId, user.organizationVersionId],
  )
  const canEditOrga = useMemo(() => canEditOrganizationVersion(user, organizationVersion), [user, organizationVersion])
  const router = useRouter()
  const { callServerFunction } = useServerFunction()

  const duplicatingSite = useMemo(
    () => (duplicatingSiteId ? study.sites.find((site) => site.id === duplicatingSiteId) : null),
    [duplicatingSiteId, study.sites],
  )

  const siteList = useMemo(
    () =>
      organizationVersion.organization.sites
        .map((site) => {
          const existingStudySite = study.sites.find((studySite) => studySite.site.id === site.id)
          return existingStudySite
            ? {
                ...existingStudySite,
                id: site.id,
                name: existingStudySite.site.name,
                selected: true,
                postalCode: existingStudySite.site.postalCode ?? '',
                city: existingStudySite.site.city ?? '',
                establishmentYear: existingStudySite.site?.establishmentYear
                  ? parseInt(existingStudySite.site?.establishmentYear)
                  : 0,
              }
            : {
                ...site,
                selected: false,
                postalCode: site.postalCode ?? '',
                city: site.city ?? '',
                cncId: site.cncId ?? '',
                establishmentYear: site?.establishmentYear ? parseInt(site?.establishmentYear) : 0,
                academy: site.academy ?? '',
                establishmentType: site.establishmentType ?? undefined,
              }
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0)) || [],
    [organizationVersion.organization.sites, study.sites],
  )

  const siteForm = useForm<ChangeStudySitesCommand>({
    resolver: zodResolver(ChangeStudySitesCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      organizationId: organizationVersion.organization.id,
      sites: siteList,
    },
  })

  const sites = useWatch({ control: siteForm.control, name: 'sites' })
  const disabledUpdateButton = isEditing && sites.every((site) => !site.selected)

  useEffect(() => {
    siteForm.setValue(
      'sites',
      siteList.map((site) => ({ ...site, ca: displayCA(site.ca, CA_UNIT_VALUES[caUnit]) })),
    )
  }, [siteList, isEditing, caUnit, siteForm])

  const onSitesSubmit = async () => {
    const deletedSites = sites.filter((site) => {
      return !site.selected && study.sites.some((studySite) => studySite.site.id === site.id)
    })
    const hasActivity = await hasActivityData(study.id, deletedSites, organizationVersion.id)
    if (hasActivity.success && hasActivity.data) {
      setOpen(true)
      setDeleting(deletedSites.length)
    } else {
      updateStudySites()
    }
  }

  const updateStudySites = async () => {
    setOpen(false)
    const formValue = siteForm.getValues()

    await callServerFunction(() => changeStudySites(study.id, siteForm.getValues()), {
      onSuccess: async () => {
        const canUpdateOrganization = await getUpdateOrganizationVersionPermission(study.organizationVersionId)
        if (canUpdateOrganization.success && canUpdateOrganization.data) {
          setReplicateSitesChanges(true)
        } else {
          setIsEditing(false)
          router.refresh()
        }
      },
    })

    if (handleSpecificChange) {
      for (const site of formValue.sites) {
        if (site.selected) {
          await handleSpecificChange(site.id, {
            volunteerNumber: site.volunteerNumber ?? 0,
            beneficiaryNumber: site.beneficiaryNumber ?? 0,
            postalCode: site.postalCode,
            etp: site.etp ?? 0,
          })
        }
      }
    }
  }

  const onReplicateSitesChanges = (replicate: boolean) => {
    if (replicate) {
      updateOrganizationSitesCommand(siteForm.getValues(), study.organizationVersionId)
    }
    setReplicateSitesChanges(false)
    setIsEditing(false)
    router.refresh()
  }

  const handleDuplicateSite = async (data: DuplicateFormData) => {
    if (!duplicatingSiteId) {
      return
    }

    await callServerFunction(
      () =>
        duplicateSiteAndEmissionSources({
          sourceSiteId: duplicatingSiteId,
          targetSiteIds: data.targetSiteIds,
          newSitesCount: data.newSitesCount,
          organizationId: organizationVersion.organization.id,
          studyId: study.id,
          fieldsToDuplicate: data.fieldsToDuplicate,
        }),
      {
        onSuccess: () => {
          setDuplicatingSiteId(null)
          router.refresh()
        },
      },
    )
  }

  return (
    <>
      <DynamicComponent
        environmentComponents={{
          [Environment.CUT]: (
            <SitesCut
              sites={
                isEditing
                  ? sites
                  : study.sites.map((site) => ({
                      ...site,
                      name: site.site.name,
                      selected: false,
                      postalCode: site.site.postalCode ?? '',
                      city: site.site.city ?? '',
                    }))
              }
              form={siteForm as unknown as UseFormReturn<SitesCommand>}
              withSelection
            />
          ),
          [Environment.TILT]: (
            <SitesTilt
              sites={
                isEditing ? sites : study.sites.map((site) => ({ ...site, name: site.site.name, selected: false }))
              }
              form={isEditing ? (siteForm as unknown as UseFormReturn<SitesCommand>) : undefined}
              caUnit={caUnit}
              withSelection
              onDuplicate={!isEditing && hasEditionRole ? setDuplicatingSiteId : undefined}
              organizationId={isFromStudyOrganizationOrParent ? study.organizationVersion.id : undefined}
              {...(handleSpecificChange && { handleSpecificChange })}
            />
          ),
        }}
        defaultComponent={
          <Sites
            sites={isEditing ? sites : study.sites.map((site) => ({ ...site, name: site.site.name, selected: false }))}
            form={isEditing ? (siteForm as unknown as UseFormReturn<SitesCommand>) : undefined}
            caUnit={caUnit}
            withSelection
            onDuplicate={!isEditing && hasEditionRole ? setDuplicatingSiteId : undefined}
            organizationId={isFromStudyOrganizationOrParent ? study.organizationVersion.id : undefined}
          />
        }
      />
      {hasEditionRole && isFromStudyOrganizationOrParent && (
        <div className={classNames('mt1 gapped', isEditing ? 'justify-between' : 'justify-end')}>
          <Button
            data-testid={`${isEditing ? 'cancel-' : ''}edit-study-sites`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {t(isEditing ? 'cancelEditSites' : 'editSites')}
          </Button>
          {isEditing && (
            <Button data-testid="confirm-edit-study-sites" disabled={disabledUpdateButton} onClick={onSitesSubmit}>
              {t('validSites')}
            </Button>
          )}
        </div>
      )}

      <DeleteStudySiteModal
        open={open}
        confirmDeletion={updateStudySites}
        cancelDeletion={() => setOpen(false)}
        deleting={deleting}
      />
      {duplicatingSite && (
        <DuplicateSiteModal
          open={!!duplicatingSiteId}
          onClose={() => setDuplicatingSiteId(null)}
          sourceSite={duplicatingSite}
          study={study}
          canEditOrganization={canEditOrga}
          caUnit={caUnit}
          onDuplicate={handleDuplicateSite}
        />
      )}
      {replicateSitesChanges && <ReplicateSitesChangesModal replicate={onReplicateSitesChanges} />}
      {glossary && (
        <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="emission-source" t={tGlossary}>
          <p className="mb-2">{tGlossary(`${glossary}Description`)}</p>
        </GlossaryModal>
      )}
    </>
  )
}

export default StudySites
