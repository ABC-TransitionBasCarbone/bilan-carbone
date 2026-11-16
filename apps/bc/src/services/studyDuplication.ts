import { createEmissionSourcesWithReturn, getFamilyTagsForStudy } from '@/db/emissionSource'
import { getOrganizationWithSitesById } from '@/db/organization'
import { createEmissionSourceTags, createStudy, FullStudy, getStudyById } from '@/db/study'
import { getTransitionPlanByStudyId } from '@/db/transitionPlan'
import { mapCncToStudySite } from '@/utils/cnc'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment, StudyRole } from '@abc-transitionbascarbone/common/db/enums'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { getEnvironmentHandlingGenericEnvs } from '@abc-transitionbascarbone/common/utils/environments'
import { v4 as uuidv4 } from 'uuid'
import { getTransEnvironmentSubPost } from './study'

export const duplicateEmissionSources = async (
  tx: Prisma.TransactionClient,
  sourceEmissionSources: FullStudy['emissionSources'],
  targetStudy: FullStudy,
  sourceStudyId: string,
  shouldClearCaracterisations: boolean,
  shouldClearValidations: boolean,
  sourceEnvironment?: Environment,
  targetEnvironment?: Environment,
  siteIds?: ReadonlyMap<string, string>,
) => {
  const { id: targetStudyId, sites: targetStudySites, tagFamilies: targetTagFamilies } = targetStudy
  const sourceTagFamilies = await getFamilyTagsForStudy(sourceStudyId, tx)
  const emissionSourcesWithSites = sourceEmissionSources
    .map((sourceEmissionSource) => {
      const sourceSiteId = sourceEmissionSource.studySite.site.id
      const targetSiteId = siteIds ? siteIds.get(sourceSiteId) : sourceSiteId
      const targetStudySiteId = targetStudySites.find((studySite) => studySite.site.id === targetSiteId)?.id
      if (!targetStudySiteId) {
        if (siteIds) {
          throw new Error(
            `Missing copied site for emission source ${sourceEmissionSource.id} in study ${sourceStudyId}`,
          )
        }
        return null
      }
      const subPost =
        sourceEnvironment && targetEnvironment
          ? getTransEnvironmentSubPost(
              getEnvironmentHandlingGenericEnvs(sourceEnvironment),
              getEnvironmentHandlingGenericEnvs(targetEnvironment),
              sourceEmissionSource.subPost,
            )
          : sourceEmissionSource.subPost
      if (!subPost) {
        if (siteIds) {
          throw new Error(`Cannot copy subpost ${sourceEmissionSource.subPost} from study ${sourceStudyId}`)
        }
        return null
      }
      return { sourceEmissionSource, targetStudySiteId, subPost }
    })
    .filter((item) => item !== null)

  const emissionSourcesDataWithSourceId = emissionSourcesWithSites.map(
    ({ sourceEmissionSource, targetStudySiteId, subPost }) => {
      const newId = uuidv4()
      const lastEditorId = sourceEmissionSource.lastEditor?.id
      return {
        sourceId: sourceEmissionSource.id,
        targetId: newId,
        data: {
          id: newId,
          name: sourceEmissionSource.name,
          value: sourceEmissionSource.value,
          subPost,
          type: sourceEmissionSource.type,
          source: sourceEmissionSource.source,
          comment: sourceEmissionSource.comment,
          feComment: sourceEmissionSource.feComment,
          depreciationPeriod: sourceEmissionSource.depreciationPeriod,
          hectare: sourceEmissionSource.hectare,
          duration: sourceEmissionSource.duration,
          reliability: sourceEmissionSource.reliability,
          technicalRepresentativeness: sourceEmissionSource.technicalRepresentativeness,
          geographicRepresentativeness: sourceEmissionSource.geographicRepresentativeness,
          temporalRepresentativeness: sourceEmissionSource.temporalRepresentativeness,
          completeness: sourceEmissionSource.completeness,
          feReliability: sourceEmissionSource.feReliability,
          feTechnicalRepresentativeness: sourceEmissionSource.feTechnicalRepresentativeness,
          feGeographicRepresentativeness: sourceEmissionSource.feGeographicRepresentativeness,
          feTemporalRepresentativeness: sourceEmissionSource.feTemporalRepresentativeness,
          feCompleteness: sourceEmissionSource.feCompleteness,
          caracterisation: shouldClearCaracterisations ? null : sourceEmissionSource.caracterisation,
          constructionYear: sourceEmissionSource.constructionYear,
          studyId: targetStudyId,
          emissionFactorId: sourceEmissionSource.emissionFactor?.id ?? null,
          studySiteId: targetStudySiteId,
          validated: shouldClearValidations ? false : sourceEmissionSource.validated,
          lastEditorId,
        },
      }
    },
  )
  const createdEmissionSourceIds = await createEmissionSourcesWithReturn(
    emissionSourcesDataWithSourceId.map((item) => item.data),
    tx,
  )
  const emissionSourceTagsData = emissionSourcesDataWithSourceId.flatMap(({ sourceId, targetId }) => {
    const sourceEmissionSource = sourceEmissionSources.find((es) => es.id === sourceId)
    if (!sourceEmissionSource) {
      return []
    }
    const createdTargetEmissionSource = createdEmissionSourceIds.find((item) => item.id === targetId)
    if (!createdTargetEmissionSource) {
      return []
    }
    return sourceEmissionSource.emissionSourceTags
      .map((emissionSourceTag) => {
        const sourceTag = sourceTagFamilies
          .flatMap((f) => f.tags.map((t) => ({ ...t, familyName: f.name })))
          .find((t) => t.id === emissionSourceTag.tag.id)
        if (!sourceTag) {
          return null
        }
        const targetFamily = targetTagFamilies.find((f) => f.name === sourceTag.familyName)
        const targetTag = targetFamily?.tags.find((t) => t.name === sourceTag.name)
        if (!targetTag) {
          return null
        }
        return { emissionSourceId: targetId, tagId: targetTag.id }
      })
      .filter((t) => t !== null)
  })
  if (emissionSourceTagsData.length > 0) {
    await createEmissionSourceTags(emissionSourceTagsData, tx)
  }
}

export const getSitesForDuplication = async (study: FullStudy, tx?: Prisma.TransactionClient) => {
  const organization = await getOrganizationWithSitesById(study.organizationVersion.organization.id, tx)
  if (!organization) {
    console.error('getSitesForDuplication: organization not found', {
      studyId: study.id,
      organizationId: study.organizationVersion.organization.id,
    })
    throw new Error(NOT_AUTHORIZED)
  }
  return study.sites
    .map((studySite) => {
      const organizationSite = organization.sites.find((organizationSite) => organizationSite.id === studySite.site.id)
      if (!organizationSite) {
        return undefined
      }
      const studySiteData: Prisma.StudySiteCreateManyStudyInput = {
        siteId: studySite.site.id,
        etp: studySite.etp || organizationSite.etp,
        ca: studySite.ca ? studySite.ca : organizationSite.ca,
        volunteerNumber: studySite.volunteerNumber || organizationSite.volunteerNumber,
        beneficiaryNumber: studySite.beneficiaryNumber || organizationSite.beneficiaryNumber,
      }
      const cncData = organizationSite.cnc
      if (cncData) {
        Object.assign(studySiteData, mapCncToStudySite(cncData))
        studySiteData.cncVersionId = cncData.cncVersionId
      }
      return studySiteData
    })
    .filter((site) => !!site)
}

export const buildStudyForDuplication = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { sourceTemplateStudyId, ...study }: Omit<FullStudy, 'id' | 'createdById' | 'organizationVersionId' | 'allowedUsers'>,
  userAccountId: string,
  organizationId: string,
  users: { accountId: string; role: StudyRole }[],
  contributors: { accountId: string; subPost: FullStudy['contributors'][number]['subPost'] }[],
  sites: Prisma.StudySiteCreateManyStudyInput[],
) => ({
  ...study,
  createdBy: { connect: { id: userAccountId } },
  organizationVersion: { connect: { id: organizationId } },
  allowedUsers: { createMany: { data: users } },
  contributors: { createMany: { data: contributors } },
  exports: { create: { types: study.exports?.types, control: study.exports?.control } },
  sites: { createMany: { data: sites } },
  emissionSources: { createMany: { data: [] } },
  emissionFactorVersions: {
    createMany: {
      data: study.emissionFactorVersions.map((emissionFactorVersion) => ({
        importVersionId: emissionFactorVersion.importVersionId,
        source: emissionFactorVersion.source,
      })),
    },
  },
  tagFamilies: {
    create: study.tagFamilies.map((tagFamily) => ({
      name: tagFamily.name,
      tags: { createMany: { data: tagFamily.tags.map((tag) => ({ name: tag.name, color: tag.color })) } },
    })),
  },
})

export const duplicateTrainingTransitionPlan = async (sourceStudyId: string, tx: Prisma.TransactionClient) => {
  await getTransitionPlanByStudyId(sourceStudyId, tx)
}

export const duplicateTrainingStudy = async (
  study: FullStudy,
  accounts: { id: string; environment: Environment }[],
  role: StudyRole,
  tx: Prisma.TransactionClient,
  nameSuffix?: string,
  target?: { organizationVersionId: string; siteIds: ReadonlyMap<string, string> },
) => {
  const environment = accounts[0].environment
  const sourceSites = await getSitesForDuplication(study, tx)
  const sites = sourceSites.map((site) => {
    if (!target) {
      return site
    }
    const siteId = target.siteIds.get(site.siteId)
    if (!siteId) {
      throw new Error(`Missing copied site ${site.siteId} for study ${study.id}`)
    }
    return { ...site, siteId }
  })
  if (target && sites.length !== study.sites.length) {
    throw new Error(`Missing organization sites for study ${study.id}`)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdById, organizationVersionId, ...restStudy } = study
  if (nameSuffix) {
    restStudy.name += nameSuffix
  }
  const creator = accounts.length === 1 ? accounts[0].id : createdById
  const targetOrganizationVersionId = target?.organizationVersionId ?? study.organizationVersion.id
  const command: Prisma.StudyCreateInput = buildStudyForDuplication(
    restStudy,
    creator,
    targetOrganizationVersionId,
    accounts.map((account) => ({ accountId: account.id, role })),
    [],
    sites,
  )
  if (target) {
    command.sourceTemplateStudy = { connect: { id: study.id } }
  }
  const createdStudy = await createStudy(command, environment, false, tx)
  const createdStudyWithSites = await getStudyById(createdStudy.id, targetOrganizationVersionId, tx)
  if (!createdStudyWithSites) {
    throw new Error(`Created training study ${createdStudy.id} not found`)
  }
  await duplicateEmissionSources(
    tx,
    study.emissionSources,
    createdStudyWithSites,
    study.id,
    false,
    false,
    study.organizationVersion.environment,
    environment,
    target?.siteIds,
  )
  await duplicateTrainingTransitionPlan(study.id, tx)
  return createdStudy
}
