'use client'

import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getStudy } from '@/services/serverFunctions/study'
import { CreateStudyCommand, SitesCommand } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { ControlMode, Export, OpeningHours, SiteCAUnit } from '@prisma/client'
import dayjs from 'dayjs'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface UseDuplicateStudyProps {
  duplicateStudyId: string | null
  form: UseFormReturn<CreateStudyCommand>
  user: UserSession
  caUnit: SiteCAUnit
}

export const useDuplicateStudy = ({ duplicateStudyId, form, user, caUnit }: UseDuplicateStudyProps) => {
  if (!duplicateStudyId) {
    return { targetOrganizationVersionId: null, isLoading: false }
  }

  const tStudy = useTranslations('study')
  const { callServerFunction } = useServerFunction()
  const [isLoading, setIsLoading] = useState(true)
  const [targetOrganizationVersionId, setTargetOrganizationVersionId] = useState<string | null>(null)

  const getOriginalStudy = useCallback(async () => {
    console.log('getOriginalStudy', duplicateStudyId)
    if (!duplicateStudyId) {
      return
    }

    await callServerFunction(() => getStudy(duplicateStudyId), {
      onSuccess: (sourceStudy) => {
        if (!sourceStudy) {
          return
        }

        setTargetOrganizationVersionId(sourceStudy.organizationVersionId)

        const currentSites = form.getValues('sites')
        const updatedSites = updateSitesFromSourceStudy(currentSites, sourceStudy, caUnit)
        const formData = createDuplicateFormData(sourceStudy, user, tStudy, updatedSites)

        form.reset(formData)
      },
    })
    setIsLoading(false)
  }, [duplicateStudyId, callServerFunction, form, caUnit, user, tStudy])

  useEffect(() => {
    getOriginalStudy()
  }, [getOriginalStudy])

  return { targetOrganizationVersionId, isLoading }
}

export const updateSitesFromSourceStudy = (
  formSites: SitesCommand['sites'],
  sourceStudy: FullStudy,
  caUnit: SiteCAUnit,
) => {
  const selectedSitesById = new Map(sourceStudy.sites.map((studySite) => [studySite.site.id, studySite]))

  return formSites.map((site) => {
    const sourceStudySite = selectedSitesById.get(site.id)

    if (sourceStudySite) {
      const emissionSourcesCount = sourceStudy.emissionSources.filter(
        (source) => source.studySite.id === sourceStudySite.id,
      ).length

      return {
        ...site,
        selected: true,
        etp: sourceStudySite.etp,
        ca: sourceStudySite.ca ? displayCA(sourceStudySite.ca, CA_UNIT_VALUES[caUnit]) : 0,
        emissionSourcesCount,
      }
    }

    return site
  })
}

export const createExportsRecord = (sourceStudyExports: FullStudy['exports']) => {
  return sourceStudyExports.reduce(
    (acc, exp) => {
      acc[exp.type] = exp.control
      return acc
    },
    {
      [Export.Beges]: false,
      [Export.GHGP]: false,
      [Export.ISO14069]: false,
    } as Record<Export, false | ControlMode>,
  )
}

export const createDuplicateFormData = (
  sourceStudy: FullStudy,
  user: UserSession,
  tStudy: (key: string) => string,
  mergedSites: SitesCommand['sites'],
) => {
  return {
    name: `${sourceStudy.name}${tStudy('duplicateCopy')}`,
    validator: user.email,
    isPublic: sourceStudy.isPublic ? 'true' : 'false',
    startDate: dayjs(sourceStudy.startDate).toISOString(),
    endDate: dayjs(sourceStudy.endDate).toISOString(),
    realizationStartDate: sourceStudy.realizationStartDate
      ? dayjs(sourceStudy.realizationStartDate).toISOString()
      : dayjs().toISOString(),
    realizationEndDate: sourceStudy.realizationEndDate ? dayjs(sourceStudy.realizationEndDate).toISOString() : null,
    level: sourceStudy.level,
    resultsUnit: sourceStudy.resultsUnit,
    organizationVersionId: sourceStudy.organizationVersionId,
    numberOfSessions: sourceStudy.numberOfSessions || undefined,
    numberOfTickets: sourceStudy.numberOfTickets || undefined,
    numberOfOpenDays: sourceStudy.numberOfOpenDays || undefined,
    openingHours: mapOpeningHours(sourceStudy.openingHours, false),
    openingHoursHoliday: mapOpeningHours(sourceStudy.openingHours, true),
    sites: mergedSites,
    exports: createExportsRecord(sourceStudy.exports),
  }
}

export const mapOpeningHours = (openingHours: OpeningHours[], isHoliday: boolean) => {
  return (
    openingHours?.reduce(
      (acc, oh) => {
        if (oh.isHoliday === isHoliday) {
          acc[oh.day] = {
            openHour: oh.openHour || '',
            closeHour: oh.closeHour || '',
          }
        }
        return acc
      },
      {} as Record<string, { openHour: string; closeHour: string }>,
    ) || {}
  )
}
