'use client'

import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getStudy } from '@/services/serverFunctions/study'
import { CreateStudyCommand, SitesCommand } from '@/services/serverFunctions/study.command'
import { CA_UNIT_VALUES, displayCA } from '@/utils/number'
import { SiteCAUnit } from '@prisma/client'
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
  const tStudy = useTranslations('study')
  const { callServerFunction } = useServerFunction()
  const [isLoading, setIsLoading] = useState(true)
  const [sourceStudy, setSourceStudy] = useState<FullStudy | null>(null)

  const getOriginalStudy = useCallback(async () => {
    if (!duplicateStudyId) {
      return
    }

    await callServerFunction(() => getStudy(duplicateStudyId), {
      onSuccess: (sourceStudy) => {
        if (!sourceStudy) {
          return
        }

        setSourceStudy(sourceStudy)

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

  if (!duplicateStudyId) {
    return { isLoading: false, sourceStudy: null }
  }

  return { isLoading, sourceStudy }
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
        volunteerNumber: sourceStudySite.volunteerNumber ?? 0,
        beneficiaryNumber: sourceStudySite.beneficiaryNumber ?? 0,
        emissionSourcesCount,
      }
    }

    return site
  })
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
    sites: mergedSites,
    exports: sourceStudy.exports?.types,
    controlMode: sourceStudy.exports?.control,
  }
}
