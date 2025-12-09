import { StudyContributorDeleteParams } from '@/components/study/rights/StudyContributorsTable'
import { getEnvVar } from '@/lib/environment'
import { hasAccessToCreateStudyWithEmissionFactorVersions } from '@/services/permissions/environment'
import { filterAllowedStudies } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { ChangeStudyCinemaCommand } from '@/services/serverFunctions/study.command'
import { getAllowedLevels, hasSufficientLevel } from '@/services/study'
import { mapCncToStudySite } from '@/utils/cnc'
import { isAdminOnOrga } from '@/utils/organization'
import { getUserRoleOnPublicStudy } from '@/utils/study'
import { isAdmin } from '@/utils/user'
import {
  ControlMode,
  DuplicableStudy,
  Environment,
  Export,
  Import,
  Level,
  StudyRole,
  StudyTag,
  StudyTagFamily,
  SubPost,
  type Prisma,
} from '@prisma/client'
import { UserSession } from 'next-auth'
import { getAccountOrganizationVersions } from './account'
import { prismaClient } from './client'
import { getOrganizationVersionById, OrganizationVersionWithOrganization } from './organization'

const cutFeLegifrance = getEnvVar('FE_LEGIFRANCE_VERSION', Environment.CUT) || ''
const cutFeBaseEmpreinte = getEnvVar('FE_BASE_EMPREINTE_VERSION', Environment.CUT) || ''

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
  const dbStudy = await client.study.create({ data })

  if (hasAccessToCreateStudyWithEmissionFactorVersions(environment) || shouldCreateFEVersions) {
    let studyEmissionFactorVersions: Prisma.StudyEmissionFactorVersionCreateManyInput[] = []
    if (environment === Environment.CUT) {
      studyEmissionFactorVersions = (await getSourceCutImportVersionIds()).map((importVersion) => ({
        studyId: dbStudy.id,
        source: importVersion.source,
        importVersionId: importVersion.id,
      }))
    } else if (environment === Environment.CLICKSON) {
      studyEmissionFactorVersions = (await getSourceClicksonImportVersionIds()).map((importVersion) => ({
        studyId: dbStudy.id,
        source: importVersion.source,
        importVersionId: importVersion.id,
      }))
    } else {
      const sources = Object.values(Import).filter((source) => source !== Import.Manual && source !== Import.CUT)

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
          location: true,
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
      contributor: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
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
          cnc: {
            select: {
              id: true,
              numberOfProgrammedFilms: true,
              ecrans: true,
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
  exports: { select: { type: true, control: true } },
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

export const getOrganizationVersionStudiesOrderedByStartDate = async (organizationVersionId: string) => {
  const studies = await prismaClient.study.findMany({
    where: {
      organizationVersionId,
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

export const getAllowedStudiesByUserAndOrganization = async (user: UserSession, organizationVersionId: string) => {
  const organizationVersion = await getOrganizationVersionById(organizationVersionId)

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
      ...(isAdminOnOrga(user, organizationVersion as OrganizationVersionWithOrganization)
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

export const getStudyById = async (id: string, organizationVersionId: string | null, tx?: Prisma.TransactionClient) => {
  const client = tx ?? prismaClient
  const study = await client.study.findUnique({
    where: { id },
    include: fullStudyInclude,
  })
  if (!study) {
    return null
  }
  return { ...study, allowedUsers: normalizeAllowedUsers(study.allowedUsers, study.level, organizationVersionId) }
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
    },
  })

export const getStudyValidatedEmissionsSources = async (studyId: string) => {
  const study = await prismaClient.study.findUnique({
    where: { id: studyId },
    select: { emissionSources: { select: { validated: true } } },
  })

  if (!study) {
    return null
  }
  return {
    total: study.emissionSources.length,
    validated: study.emissionSources.filter((emissionSource) => emissionSource.validated).length,
  }
}

export const getSourceCutImportVersionIds = async () =>
  prismaClient.emissionFactorImportVersion.findMany({
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

export const getSourceClicksonImportVersionIds = async () =>
  prismaClient.emissionFactorImportVersion.findMany({
    select: { id: true, source: true },
    where: {
      source: Import.BaseEmpreinte,
    },
    orderBy: { createdAt: 'desc' },
    distinct: ['source'],
  })

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

export const upsertStudyExport = async (studyId: string, type: Export, control: ControlMode) =>
  prismaClient.studyExport.upsert({
    where: { studyId_type: { studyId, type } },
    update: { control },
    create: { studyId, type, control },
  })

export const deleteStudyExport = async (studyId: string, type: Export) =>
  prismaClient.studyExport.delete({ where: { studyId_type: { studyId, type } } })

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
