import { StudyContributorDeleteParams } from '@/components/study/rights/StudyContributorsTable'
import { getEnvVar } from '@/lib/environment'
import { isSourceForEnv } from '@/services/importEmissionFactor/import'
import { hasAccessToCreateStudyWithEmissionFactorVersions } from '@/services/permissions/environment'
import { filterAllowedStudies } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { ChangeStudyCinemaCommand } from '@/services/serverFunctions/study.command'
import { getAllowedLevels, hasSufficientLevel } from '@/services/study'
import { mapCncToStudySite } from '@/utils/cnc'
import { isAdminOnOrga } from '@/utils/organization'
import { getUserRoleOnPublicStudy, StudyWithRoleFields } from '@/utils/study'
import { isAdmin } from '@/utils/user'
import type { DuplicableStudy, Level, Prisma, StudyTag, StudyTagFamily, SubPost } from '@repo/db-common'
import { CommentStatus, ControlMode, Environment, Export, Import, StudyRole } from '@repo/db-common/enums'
import { UserSession } from 'next-auth'
import { cache } from 'react'
import { getAccountOrganizationVersions } from './account'
import { AccountWithUserSelect } from './account.select'
import { prismaClient } from './client.server'
import { getOrganizationVersionForRightsCheck } from './organization'

export type StudyTagFamilyWithTags = Omit<StudyTagFamily, 'createdAt' | 'updatedAt'> & {
  tags: Omit<StudyTag, 'familyId' | 'createdAt' | 'updatedAt'>[]
}

export const createStudy = async (
  data: Prisma.StudyCreateInput,
  environment: Environment,
  shouldCreateFEVersions = true,
  tx?: Prisma.TransactionClient,
) => {
  const client = tx ?? prismaClient
  const dbStudy = await client.study.create({
    data,
    select: { id: true, exports: { select: { types: true } }, sites: { select: { id: true, country: true } } },
  })

  if (hasAccessToCreateStudyWithEmissionFactorVersions(environment) || shouldCreateFEVersions) {
    let studyEmissionFactorVersions: Prisma.StudyEmissionFactorVersionCreateManyInput[] = []
    if (environment === Environment.CUT) {
      studyEmissionFactorVersions = (await getSourceCutImportVersionIds()).map((importVersion) => ({
        studyId: dbStudy.id,
        source: importVersion.source,
        importVersionId: importVersion.id,
      }))
    } else if (environment === Environment.CLICKSON) {
      studyEmissionFactorVersions = (await getSourceEnvironmentImportVersionIds(Environment.CLICKSON)).map(
        (importVersion) => ({
          studyId: dbStudy.id,
          source: importVersion.source,
          importVersionId: importVersion.id,
        }),
      )
    } else {
      const hasGHGP = dbStudy.exports?.types.includes(Export.GHGP)
      const sources = Object.values(Import).filter(
        (source) => source !== Import.Manual && source !== Import.CUT && (source !== Import.AIB || hasGHGP),
      )

      const latestVersions = await getSourcesLatestImportVersionId(sources)
      if (latestVersions) {
        studyEmissionFactorVersions = latestVersions.map((latestImportVersion) => ({
          studyId: dbStudy.id,
          source: latestImportVersion.source,
          importVersionId: latestImportVersion.id,
        }))
      }
    }
    await client.studyEmissionFactorVersion.createMany({ data: studyEmissionFactorVersions })
  }
  return dbStudy
}

const fullStudyInclude = {
  emissionSources: {
    select: {
      id: true,
      createdAt: true,
      subPost: true,
      name: true,
      caracterisation: true,
      constructionYear: true,
      value: true,
      reliability: true,
      technicalRepresentativeness: true,
      geographicRepresentativeness: true,
      temporalRepresentativeness: true,
      completeness: true,
      feReliability: true,
      feTechnicalRepresentativeness: true,
      feGeographicRepresentativeness: true,
      feTemporalRepresentativeness: true,
      feCompleteness: true,
      source: true,
      type: true,
      comment: true,
      validated: true,
      depreciationPeriod: true,
      hectare: true,
      duration: true,
      updatedAt: true,
      studySite: {
        select: {
          id: true,
          site: {
            select: { id: true, name: true },
          },
        },
      },
      emissionFactorId: true,
      emissionFactor: {
        select: {
          id: true,
          totalCo2: true,
          unit: true,
          customUnit: true,
          isMonetary: true,
          reliability: true,
          technicalRepresentativeness: true,
          geographicRepresentativeness: true,
          temporalRepresentativeness: true,
          completeness: true,
          importedFrom: true,
          importedId: true,
          base: true,
          location: true,
          emissionFactorParts: {
            select: {
              type: true,
            },
          },
          metaData: {
            select: {
              language: true,
              title: true,
              attribute: true,
              frontiere: true,
              location: true,
              comment: true,
            },
          },
          version: {
            select: {
              id: true,
            },
          },
        },
      },
      lastEditor: {
        select: AccountWithUserSelect,
      },
      emissionSourceTags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
              familyId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
  },
  contributors: {
    select: {
      accountId: true,
      account: {
        select: {
          id: true,
          organizationVersionId: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      subPost: true,
    },
    orderBy: { account: { user: { email: 'asc' } } },
  },
  allowedUsers: {
    select: {
      accountId: true,
      createdAt: true,
      account: {
        select: {
          id: true,
          organizationVersionId: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              level: true,
            },
          },
        },
      },
      role: true,
    },
    orderBy: { account: { user: { email: 'asc' } } },
  },
  sites: {
    select: {
      id: true,
      etp: true,
      ca: true,
      openingHours: true,
      numberOfOpenDays: true,
      numberOfSessions: true,
      numberOfTickets: true,
      distanceToParis: true,
      volunteerNumber: true,
      beneficiaryNumber: true,
      superficy: true,
      studentNumber: true,
      country: true,
      site: {
        select: {
          id: true,
          name: true,
          postalCode: true,
          city: true,
          address: true,
          establishmentYear: true,
          etp: true,
          studentNumber: true,
          superficy: true,
          country: true,
          cnc: {
            select: {
              id: true,
              numberOfProgrammedFilms: true,
              ecrans: true,
              fauteuils: true,
            },
          },
        },
      },
      cncVersion: {
        select: {
          id: true,
          year: true,
        },
      },
    },
  },
  emissionFactorVersions: {
    select: {
      id: true,
      importVersionId: true,
      source: true,
      importVersion: {
        select: {
          name: true,
          source: true,
          id: true,
        },
      },
    },
  },
  exports: { select: { types: true, control: true } },
  organizationVersion: {
    select: {
      id: true,
      isCR: true,
      parentId: true,
      parent: {
        select: { id: true, activatedLicence: true },
      },
      environment: true,
      activatedLicence: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  tagFamilies: {
    select: {
      id: true,
      name: true,
      studyId: true,
      createdAt: true,
      updatedAt: true,
      tags: {
        select: {
          id: true,
          familyId: true,
          name: true,
          color: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.StudyInclude

const normalizeAllowedUsers = (
  allowedUsers: Prisma.StudyGetPayload<{ include: typeof fullStudyInclude }>['allowedUsers'],
  studyLevel: Level,
  organizationVersionId: string | null,
) =>
  allowedUsers.map((allowedUser) => {
    const readerOnly =
      !allowedUser.account.organizationVersionId || !hasSufficientLevel(allowedUser.account.user.level, studyLevel)
    return organizationVersionId && allowedUser.account.organizationVersionId === organizationVersionId
      ? { ...allowedUser, account: { ...allowedUser.account, readerOnly } }
      : {
          ...allowedUser,
          account: {
            ...allowedUser.account,
            organizationVersionId: undefined,
            level: undefined,
            readerOnly,
          },
        }
  })

export const getOrganizationVersionStudiesOrderedByStartDate = async (
  organizationVersionId: string,
  displaySimplifiedStudies: boolean,
) => {
  const studies = await prismaClient.study.findMany({
    where: {
      organizationVersionId,
      simplified: displaySimplifiedStudies ? undefined : false,
    },
    include: fullStudyInclude,
    orderBy: { startDate: 'desc' },
  })
  return studies.map((study) => ({
    ...study,
    allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, organizationVersionId),
  }))
}

export const getAllowedStudiesByAccount = async (user: UserSession) => {
  const accountOrganizationVersions = await getAccountOrganizationVersions(user.accountId)

  // Be carefull: study on this query is shown to a lot of user
  // Never display sensitive data here (like emission source)
  const studies = await prismaClient.study.findMany({
    where: {
      OR: [
        {
          AND: [
            {
              organizationVersionId: {
                in: accountOrganizationVersions.map((organizationVersion) => organizationVersion.id),
              },
            },
            ...(isAdmin(user.role) ? [] : [{ isPublic: true, level: { in: getAllowedLevels(user.level) } }]),
          ],
        },
        { allowedUsers: { some: { accountId: user.accountId } } },
        { contributors: { some: { accountId: user.accountId } } },
      ],
    },
  })
  return filterAllowedStudies(user, studies)
}

export const getExternalAllowedStudiesByUser = async (user: UserSession) => {
  const userOrganizationVersions = await getAccountOrganizationVersions(user.accountId)
  const studies = await prismaClient.study.findMany({
    where: {
      AND: [
        {
          organizationVersionId: {
            notIn: userOrganizationVersions.map((organizationVersion) => organizationVersion.id),
          },
        },
        {
          OR: [
            { allowedUsers: { some: { accountId: user.accountId } } },
            { contributors: { some: { accountId: user.accountId } } },
          ],
        },
      ],
    },
  })
  return filterAllowedStudies(user, studies)
}

export const getAllowedStudiesByAccountIdAndOrganizationId = async (organizationVersionIds: string[]) => {
  return prismaClient.study.findMany({
    select: {
      id: true,
      name: true,
      allowedUsers: true,
      organizationVersionId: true,
      organizationVersion: { select: { organization: { select: { name: true } } } },
    },
    where: {
      organizationVersionId: { in: organizationVersionIds },
    },
  })
}

export const getAllowedStudyIdByAccount = async (account: UserSession) => {
  const organizationVersionIds = (await getAccountOrganizationVersions(account.accountId)).map(
    (organizationVersion) => organizationVersion.id,
  )
  const isAllowedOnPublicStudies =
    account.level && getUserRoleOnPublicStudy(account, account.level) !== StudyRole.Reader
  const study = await prismaClient.study.findFirst({
    where: {
      OR: [
        { allowedUsers: { some: { accountId: account.id, role: { notIn: [StudyRole.Reader] } } } },
        ...(isAllowedOnPublicStudies
          ? [
              {
                AND: [
                  { organizationVersionId: { in: organizationVersionIds } },
                  ...(isAdmin(account.role)
                    ? []
                    : [{ isPublic: true, level: { in: getAllowedLevels(account.level) } }]),
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
  return study?.id
}

export const getAllowedStudiesByUserAndOrganization = async (
  user: UserSession,
  organizationVersionId: string,
  simplified = false,
) => {
  const organizationVersion = await getOrganizationVersionForRightsCheck(organizationVersionId)
  if (!organizationVersion) {
    return []
  }

  if (!user.organizationVersionId) {
    return []
  }
  const childOrganizations = await prismaClient.organizationVersion.findMany({
    where: { parentId: user.organizationVersionId },
    select: { id: true },
  })

  const studies = await prismaClient.study.findMany({
    where: {
      organizationVersionId,
      simplified,
      ...(isAdminOnOrga(user, organizationVersion)
        ? {}
        : {
            OR: [
              { allowedUsers: { some: { accountId: user.accountId } } },
              { contributors: { some: { accountId: user.accountId } } },
              { isPublic: true, organizationVersionId: user.organizationVersionId as string },
              {
                isPublic: true,
                organizationVersionId: {
                  in: childOrganizations.map((organizationVersion) => organizationVersion.id),
                },
              },
            ],
          }),
    },
  })
  return filterAllowedStudies(user, studies)
}

const fetchStudyById = cache(async (id: string) => {
  return prismaClient.study.findUnique({
    where: { id },
    include: fullStudyInclude,
  })
})

// IMPORTANT: Do not use unless you need the full study with all its fields and relations.
export const getStudyById = async (id: string, organizationVersionId: string | null, tx?: Prisma.TransactionClient) => {
  const study = tx ? await tx.study.findUnique({ where: { id }, include: fullStudyInclude }) : await fetchStudyById(id)
  if (!study) {
    return null
  }
  return { ...study, allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, organizationVersionId) }
}

type StudyForNavbar = StudyWithRoleFields & {
  name: string
  simplified: boolean
}

export const getStudyForNavbar = async (id: string): Promise<StudyForNavbar | null> => {
  return prismaClient.study.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      simplified: true,
      level: true,
      isPublic: true,
      organizationVersion: {
        select: {
          id: true,
          parentId: true,
          environment: true,
          activatedLicence: true,
          parent: { select: { activatedLicence: true } },
        },
      },
      allowedUsers: {
        select: {
          role: true,
          account: { select: { id: true, user: { select: { email: true } } } },
        },
      },
    },
  })
}

export const getStudyOrganizationVersion = async (id: string) => {
  const study = await prismaClient.study.findUnique({
    where: { id },
    select: { organizationVersion: { select: { id: true, parentId: true } } },
  })
  return study?.organizationVersion ?? null
}

export const getStudiesForCards = async (ids: string[]) => {
  const studies = await prismaClient.study.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      simplified: true,
      level: true,
      isPublic: true,
      contributors: {
        select: { accountId: true },
      },
      allowedUsers: {
        select: {
          role: true,
          account: { select: { id: true, user: { select: { email: true } } } },
        },
      },
      organizationVersion: {
        select: {
          id: true,
          parentId: true,
          environment: true,
          activatedLicence: true,
          parent: { select: { activatedLicence: true } },
        },
      },
    },
  })
  return Object.fromEntries(studies.map((study) => [study.id, study]))
}

export const getStudiesValidatedEmissionsSources = async (ids: string[]) => {
  const groups = await prismaClient.studyEmissionSource.groupBy({
    by: ['studyId', 'validated'],
    where: { studyId: { in: ids } },
    _count: true,
  })

  const result: Record<string, { total: number; validated: number }> = {}
  for (const id of ids) {
    result[id] = { total: 0, validated: 0 }
  }
  for (const group of groups) {
    result[group.studyId].total += group._count
    if (group.validated) {
      result[group.studyId].validated += group._count
    }
  }
  return result
}

type StudiesForCardsMap = AsyncReturnType<typeof getStudiesForCards>

export type StudyCardItem = StudiesForCardsMap[string] & {
  validatedSources: { total: number; validated: number }
}

export const getStudyByIds = async (ids: string[]) => {
  const studies = await prismaClient.study.findMany({
    where: { id: { in: ids } },
    include: fullStudyInclude,
  })
  return studies.map((study) => ({
    ...study,
    allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, null),
  }))
}
export type FullStudy = Exclude<AsyncReturnType<typeof getStudyById>, null>

export const getStudyNameById = async (id: string) => {
  const study = await prismaClient.study.findUnique({
    where: { id },
    select: { name: true },
  })
  if (!study) {
    return null
  }
  return study.name
}

export const getStudyStartDate = async (id: string) => {
  const study = await prismaClient.study.findUnique({
    where: { id },
    select: { startDate: true },
  })

  if (!study) {
    return null
  }

  return study.startDate
}

export const createUserOnStudy = async (right: Prisma.UserOnStudyCreateInput, tx?: Prisma.TransactionClient) =>
  (tx ?? prismaClient).userOnStudy.create({
    data: right,
  })

export const updateUserOnStudy = (accountId: string, studyId: string, role: StudyRole) =>
  prismaClient.userOnStudy.update({
    where: {
      studyId_accountId: {
        accountId,
        studyId,
      },
    },
    data: {
      role,
    },
  })

export const getUsersOnStudy = async (studyId: string) => prismaClient.userOnStudy.findMany({ where: { studyId } })

export const deleteAccountOnStudy = async (studyId: string, accountId: string) =>
  prismaClient.userOnStudy.delete({
    where: { studyId_accountId: { studyId, accountId } },
  })

export const deleteContributor = async (studyId: string, contributor: StudyContributorDeleteParams) => {
  const where: Prisma.ContributorsWhereInput = {
    studyId,
    accountId: contributor.accountId,
  }
  if (contributor.subPosts[0] !== 'allSubPost') {
    where.subPost = contributor.subPosts[0] as SubPost
  } else if (contributor.post !== 'allPost') {
    const subPosts = subPostsByPost[contributor.post as Post]
    where.subPost = { in: subPosts }
  }

  return prismaClient.contributors.deleteMany({ where })
}

export const getUsersLevel = async (userIds: string[]) =>
  prismaClient.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, level: true },
  })

export const updateStudy = (id: string, data: Prisma.StudyUpdateInput) =>
  prismaClient.study.update({ where: { id }, data })

export const downgradeStudyUserRoles = (studyId: string, accountIds: string[]) =>
  Promise.all(
    accountIds.map((accountId) =>
      prismaClient.userOnStudy.update({
        where: { studyId_accountId: { studyId, accountId } },
        data: { role: StudyRole.Reader },
      }),
    ),
  )

export const getStudySites = (studyId: string) => prismaClient.studySite.findMany({ where: { studyId } })

export const updateStudySiteData = async (studySiteId: string, data: Prisma.StudySiteUpdateInput) => {
  return prismaClient.studySite.update({
    where: { id: studySiteId },
    data,
  })
}

export const updateStudySites = async (
  studyId: string,
  newStudySites: Prisma.StudySiteCreateManyInput[],
  deletedSiteIds: string[],
) => {
  return prismaClient.$transaction(async (transaction) => {
    const promises = []
    if (deletedSiteIds.length) {
      await transaction.studyEmissionSource.deleteMany({ where: { studyId, studySiteId: { in: deletedSiteIds } } })
      promises.push(transaction.studySite.deleteMany({ where: { id: { in: deletedSiteIds }, studyId } }))
    }
    if (newStudySites.length) {
      const siteIds = newStudySites.map((site) => site.siteId)
      const sitesWithCNC = await transaction.site.findMany({
        where: { id: { in: siteIds } },
        include: {
          cnc: {
            select: {
              seances: true,
              entrees2024: true,
              entrees2023: true,
              semainesActivite: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      })

      newStudySites.forEach((studySite) => {
        const siteWithCNC = sitesWithCNC.find((s) => s.id === studySite.siteId)
        const cncData = siteWithCNC?.cnc

        const enhancedStudySite = { ...studySite }

        if (cncData) {
          Object.assign(enhancedStudySite, mapCncToStudySite(cncData, enhancedStudySite))
        }

        promises.push(
          transaction.studySite.upsert({
            where: { studyId_siteId: { studyId, siteId: studySite.siteId } },
            update: {
              ca: studySite.ca,
              etp: studySite.etp,
              volunteerNumber: studySite.volunteerNumber,
              beneficiaryNumber: studySite.beneficiaryNumber,
            },
            create: enhancedStudySite,
          }),
        )
      })
    }

    return Promise.all(promises)
  })
}

export const createStudyEmissionSource = async (data: Prisma.StudyEmissionSourceCreateInput) =>
  prismaClient.studyEmissionSource.create({ data })

export const updateEmissionSourceEmissionFactor = (emissionSourceId: string, emissionFactorId: string) =>
  prismaClient.studyEmissionSource.update({
    where: { id: emissionSourceId },
    data: { emissionFactorId },
  })

export const clearEmissionSourceEmissionFactor = (emissionSourceId: string) =>
  prismaClient.studyEmissionSource.update({
    where: { id: emissionSourceId },
    data: { emissionFactorId: null, validated: false },
  })

export const updateStudyEmissionFactorVersion = async (
  studyId: string,
  source: Import,
  importVersionId?: string,
  tx?: Prisma.TransactionClient,
) =>
  (tx ?? prismaClient).studyEmissionFactorVersion.update({
    where: { studyId_source: { studyId, source } },
    data: { importVersionId },
  })

export const deleteStudy = async (id: string) => {
  return prismaClient.$transaction(async (transaction) => {
    const studySites = await getStudySites(id)

    const tagFamilies = await transaction.studyTagFamily.findMany({
      where: { studyId: id },
      select: { id: true },
    })

    await Promise.all(
      tagFamilies.map((tagFamily) => {
        transaction.studyTagFamily.update({
          where: { id: tagFamily.id },
          data: { tags: undefined },
        })
      }),
    )

    await Promise.all([
      transaction.userOnStudy.deleteMany({ where: { studyId: id } }),
      transaction.studyTag.deleteMany({ where: { familyId: { in: tagFamilies.map((f) => f.id) } } }),
      transaction.studyTagFamily.deleteMany({ where: { studyId: id } }),
      transaction.studyEmissionSource.deleteMany({ where: { studyId: id } }),
      transaction.contributors.deleteMany({ where: { studyId: id } }),
      transaction.studySite.deleteMany({ where: { studyId: id } }),
      transaction.document.deleteMany({ where: { studyId: id } }),
      transaction.studyEmissionFactorVersion.deleteMany({ where: { studyId: id } }),
      transaction.studyExport.deleteMany({ where: { studyId: id } }),
      ...studySites.map((studySite) => transaction.openingHours.deleteMany({ where: { studySiteId: studySite.id } })),
    ])
    await transaction.study.delete({ where: { id } })
  })
}

export const createContributorOnStudy = (
  accountId: string,
  subPosts: SubPost[],
  data: Omit<Prisma.ContributorsCreateManyInput, 'accountId' | 'subPost'>,
  tx?: Prisma.TransactionClient,
) =>
  (tx ?? prismaClient).contributors.createMany({
    data: subPosts.map((subPost) => ({ ...data, accountId, subPost })),
    skipDuplicates: true,
  })

export const getStudiesSitesFromIds = async (siteIds: string[]) =>
  prismaClient.studySite.findMany({
    where: {
      id: {
        in: siteIds,
      },
    },
    include: {
      study: {
        select: {
          id: true,
          name: true,
          isPublic: true,
          level: true,
          allowedUsers: { select: { accountId: true } },
          contributors: { select: { accountId: true } },
          organizationVersionId: true,
          simplified: true,
          organizationVersion: {
            select: {
              id: true,
              isCR: true,
              parentId: true,
              organization: {
                select: { id: true },
              },
            },
          },
        },
      },
      site: {
        select: {
          name: true,
          organization: {
            select: {
              id: true,
              name: true,
              organizationVersions: {
                select: {
                  isCR: true,
                },
              },
            },
          },
          cnc: {
            select: {
              id: true,
              numberOfProgrammedFilms: true,
              latitude: true,
              longitude: true,
              seances: true,
              entrees2024: true,
              entrees2023: true,
              semainesActivite: true,
            },
          },
        },
      },
      cncVersion: {
        select: {
          id: true,
          year: true,
        },
      },
      situation: true,
    },
  })

export const getSourceCutImportVersionIds = async () => {
  const cutFeLegifrance = (await getEnvVar('FE_LEGIFRANCE_VERSION', Environment.CUT)) || ''
  const cutFeBaseEmpreinte = (await getEnvVar('FE_BASE_EMPREINTE_VERSION', Environment.CUT)) || ''
  return prismaClient.emissionFactorImportVersion.findMany({
    select: { id: true, source: true },
    where: {
      OR: [
        { source: Import.CUT },
        { name: cutFeLegifrance, source: Import.Legifrance },
        { name: cutFeBaseEmpreinte, source: Import.BaseEmpreinte },
      ],
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['source'],
  })
}

export const getSourceEnvironmentImportVersionIds = async (
  environment: Environment,
): Promise<{ id: string; source: Import }[]> => {
  const sources = await isSourceForEnv(environment)
  return prismaClient.emissionFactorImportVersion.findMany({
    select: { id: true, source: true },
    where: {
      source: { in: sources },
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['source'],
  })
}

export const getSourcesLatestImportVersionId = async (sources: Import[]) =>
  prismaClient.emissionFactorImportVersion.findMany({
    select: { id: true, source: true },
    where: { source: { in: sources } },
    orderBy: { createdAt: 'desc' },
    distinct: ['source'],
  })

export const getSourceLatestImportVersionId = async (source: Import, transaction?: Prisma.TransactionClient) =>
  (transaction || prismaClient).emissionFactorImportVersion.findFirst({
    select: { id: true, source: true },
    where: { source },
    orderBy: { createdAt: 'desc' },
  })

export const upsertStudyExport = async (studyId: string, types: Export[], control: ControlMode) =>
  prismaClient.studyExport.upsert({
    where: { studyId },
    update: { types, control },
    create: { studyId, types, control },
  })

export const countOrganizationStudiesFromOtherUsers = async (organizationVersionId: string, accountId: string) =>
  prismaClient.study.count({ where: { organizationVersionId, createdById: { not: accountId } } })

export const updateStudyOpeningHours = async (
  studySiteId: string,
  openingHours: ChangeStudyCinemaCommand['openingHours'],
  openingHoursHoliday: ChangeStudyCinemaCommand['openingHoursHoliday'],
) => {
  await prismaClient.$transaction(async (prisma) => {
    const existingOpeningHours = await prisma.openingHours.findMany({
      where: { studySiteId },
      select: { id: true },
    })
    const mergedOpeningHours = [...Object.values(openingHours || {}), ...Object.values(openingHoursHoliday || {})]

    const existingIds = new Set(existingOpeningHours.map((openingHour) => openingHour.id))
    const updateIds = new Set(mergedOpeningHours.map((openingHour) => openingHour.id))

    const openingHourIdsToDelete = [...existingIds].filter((id) => !updateIds.has(id))

    if (openingHourIdsToDelete.length > 0) {
      await prisma.openingHours.deleteMany({
        where: { id: { in: openingHourIdsToDelete } },
      })
    }

    await prismaClient.$transaction(async (prisma) => {
      await Promise.all(
        mergedOpeningHours
          .map((openingHour) => {
            if (!openingHour.id) {
              return prisma.openingHours.create({
                data: {
                  ...openingHour,
                  studySite: { connect: { id: studySiteId } },
                },
              })
            }

            return prisma.openingHours.update({
              where: { id: openingHour.id },
              data: openingHour,
            })
          })
          .filter((promise) => promise !== undefined),
      )
    })
  })
}

export const deleteStudyMemberFromOrganization = async (accountId: string, organizationVersionIds: string[]) => {
  const studies = await getAllowedStudiesByAccountIdAndOrganizationId(organizationVersionIds)
  return prismaClient.userOnStudy.deleteMany({
    where: { accountId, studyId: { in: studies.map((study) => study.id) } },
  })
}

export const getStudiesAffectedByQuestion = async (questionIdIntern: string) => {
  return prismaClient.study.findMany({
    where: {
      sites: {
        some: {
          studyAnswers: {
            some: {
              question: { idIntern: questionIdIntern },
            },
          },
        },
      },
    },
    select: { id: true, name: true },
    distinct: ['id'],
  })
}

export const upsertStudyTemplate = async (template: DuplicableStudy, environment: Environment, studyId: string) =>
  prismaClient.studyTemplate.upsert({
    where: { environment_template: { environment, template } },
    update: { studyId },
    create: { environment, template, studyId },
  })

export const getStudyTemplate = async (template: DuplicableStudy, environment: Environment) =>
  prismaClient.studyTemplate.findUnique({ where: { environment_template: { environment, template } } })

export const createEmissionSourceTags = async (
  emissionSourceTags: Prisma.EmissionSourceTagCreateManyInput[],
  tx?: Prisma.TransactionClient,
) =>
  (tx ?? prismaClient).emissionSourceTag.createMany({
    data: emissionSourceTags,
  })

export const getOrganizationStudiesBeforeDate = (organizationVersionId: string, date: Date) =>
  prismaClient.study.findMany({
    select: { id: true, name: true },
    where: { organizationVersionId, startDate: { lt: date } },
  })

export const createStudyComment = async (data: Prisma.StudyCommentCreateInput) =>
  prismaClient.studyComment.create({ data })

export const getStudyCommentsWithStudyIdAndSubPost = async (studyId: string, subPost?: SubPost | null) => {
  return prismaClient.studyComment.findMany({
    where: { studyId, subPost },
    include: {
      author: {
        select: {
          id: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}
export type FullStudyComments = Exclude<AsyncReturnType<typeof getStudyCommentsWithStudyIdAndSubPost>, null>
export type FullStudyComment = FullStudyComments[0]

export const getStudyCommentsFromOrganizationVersionId = async (
  organizationVersionId: string,
  status: CommentStatus,
) => {
  return prismaClient.studyComment.findMany({
    where: { study: { organizationVersionId: organizationVersionId }, status },
    include: {
      author: {
        select: {
          id: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      study: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export type OrganizationVersionWithStudyComments = Exclude<
  AsyncReturnType<typeof getStudyCommentsFromOrganizationVersionId>,
  null
>

export const getStudyCommentsCountFromOrganizationVersionId = async (
  organizationVersionId: string,
  status: CommentStatus,
) => {
  return prismaClient.studyComment.count({
    where: { study: { organizationVersionId: organizationVersionId }, status },
  })
}

export const getPendingStudyCommentsCountFromAuthor = async (authorId: string) => {
  return prismaClient.studyComment.count({
    where: { authorId, status: CommentStatus.PENDING },
  })
}

export const updateStudyComment = async (id: string, data: Prisma.StudyCommentUpdateInput) =>
  prismaClient.studyComment.update({
    where: { id },
    data,
  })

export const deleteStudyComment = async (id: string) =>
  prismaClient.studyComment.delete({
    where: { id },
  })

export const getEngagementActions = (studyId: string) =>
  prismaClient.engagementAction.findMany({
    where: { studyId },
    include: { sites: { include: { site: true } } },
  })

export const getEngagementActionById = (id: string) =>
  prismaClient.engagementAction.findUnique({
    where: { id },
  })

export const createEngagementAction = async (data: Prisma.EngagementActionCreateInput) =>
  prismaClient.engagementAction.create({ data })

export const updateEngagementAction = async (id: string, data: Prisma.EngagementActionUpdateInput) =>
  prismaClient.engagementAction.update({ where: { id }, data })

export const deleteEngagementAction = async (id: string) => prismaClient.engagementAction.delete({ where: { id } })

export const addSourceToStudy = async (source: Import, studyId: string) => {
  const [study, importVersion] = await Promise.all([
    prismaClient.study.findFirst({
      where: { id: studyId },
      select: {
        id: true,
        organizationVersion: {
          select: { environment: true },
        },
      },
    }),
    getSourceLatestImportVersionId(source),
  ])

  if (study && !!importVersion && (await isSourceForEnv(study.organizationVersion.environment)).includes(source)) {
    await prismaClient.studyEmissionFactorVersion.createMany({
      data: { studyId: study.id, source, importVersionId: importVersion.id },
      skipDuplicates: true,
    })
  }
}

export const removeSourceToStudy = async (source: Import, studyId: string) => {
  prismaClient.$transaction(async (tx) => {
    await tx.studyEmissionSource.updateMany({
      where: { studyId, emissionFactor: { importedFrom: source } },
      data: { emissionFactorId: null, validated: false },
    })
    await tx.studyEmissionFactorVersion.delete({
      where: { studyId_source: { studyId, source } },
    })
  })
}

export const removeSourceToAllStudies = async (source: Import) => {
  await prismaClient.$transaction(async (tx) => {
    await tx.studyEmissionSource.updateMany({
      where: {
        emissionFactor: { importedFrom: source },
        study: {
          exports: {
            NOT: {
              types: { has: Export.GHGP },
            },
          },
        },
      },
      data: { emissionFactorId: null, validated: false },
    })

    await tx.studyEmissionFactorVersion.deleteMany({
      where: {
        source,
        study: {
          exports: {
            NOT: {
              types: { has: Export.GHGP },
            },
          },
        },
      },
    })
  })
}
