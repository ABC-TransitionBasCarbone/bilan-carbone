// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Environment, PrismaClient, Role } from '@prisma/client'

// One shot script to migrate users to accounts and organizations to organizationVersions

const prisma = new PrismaClient()

const defaultEnvironment = Environment.BC

const migrateUsersToAccounts = async () => {
  const users = await prisma.user.findMany({
    include: {
      createdStudies: true,
      allowedStudies: true,
      contributors: true,
      contributedEmissionSources: true,
      flows: true,
      userApplicationSettings: true,
      deactivatableFeatureStatus: true,
    },
  })

  for (const user of users) {
    await prisma.$transaction(async (tx) => {
      const existingAccount = await tx.account.findFirst({
        where: { userId: user.id },
      })

      if (existingAccount) {
        console.log(`Déjà migré account: ${existingAccount.id} pour ${user.email}`)
        return
      }

      const newAccount = await tx.account.create({
        data: {
          userId: user.id,
          role: user?.role || Role.DEFAULT,
          importedFileDate: user.importedFileDate,
          environment: defaultEnvironment,
        },
      })

      const accountId = newAccount.id

      await Promise.all([
        tx.study.updateMany({
          where: { createdByUserId: user.id },
          data: { createdById: accountId },
        }),
        tx.userOnStudy.updateMany({
          where: { userId: user.id },
          data: { accountId },
        }),
        tx.contributors.updateMany({
          where: { userId: user.id },
          data: { accountId },
        }),
        tx.studyEmissionSource.updateMany({
          where: { contributorUserId: user.id },
          data: { contributorId: accountId },
        }),
        tx.document.updateMany({
          where: { uploaderUserId: user.id },
          data: { uploaderId: accountId },
        }),
      ])

      if (user.userApplicationSettings) {
        await tx.userApplicationSettings.update({
          where: { id: user.userApplicationSettings.id },
          data: { accountId },
        })
      }

      if (user.deactivatableFeatureStatus?.length) {
        await Promise.all(
          user.deactivatableFeatureStatus.map((feature) =>
            tx.deactivatableFeatureStatus.update({
              where: { id: feature.id },
              data: { updatedById: accountId },
            }),
          ),
        )
      }

      const checkedSteps = await tx.userCheckedStep.findMany({
        where: { userId: user.id },
      })

      await Promise.all(
        checkedSteps.map((step) =>
          tx.userCheckedStep.update({
            where: { id: step.id },
            data: { accountId },
          }),
        ),
      )

      console.log(`✅ Compte migré pour ${user.email}`)
    })
  }

  console.log(`🎉 Migration terminée.`)
}

const firstPassCreateVersions = async () => {
  const organizations = await prisma.organization.findMany({
    include: {
      studies: true,
      users: {
        include: {
          accounts: true,
        },
      },
      onboarder: {
        include: {
          accounts: true,
        },
      },
    },
  })

  for (const org of organizations) {
    await prisma.$transaction(async (tx) => {
      if (org.siret) {
        await tx.organization.update({
          where: { id: org.id },
          data: { wordpressId: org.siret },
        })
      }

      const existingVersion = await tx.organizationVersion.findFirst({
        where: { organizationId: org.id },
      })

      if (existingVersion) {
        console.log(`Déjà migré : ${org.name}`)
        return
      }

      const userAccounts = org.users.map((user) => user.accounts?.[0]).filter((account) => account !== null)

      const onboarderAccount = org.onboarder?.accounts?.[0]

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {
        organizationId: org.id,
        isCR: org.isCR,
        activatedLicence: org.activatedLicence,
        onboarded: org.onboarded,
        environment: defaultEnvironment,
        studies: {
          connect: org.studies.map((study) => ({ id: study.id })),
        },
        userAccounts: {
          connect: userAccounts.map((acc) => ({ id: acc.id })),
        },
      }

      if (onboarderAccount) {
        data.onboarderId = onboarderAccount.id
      }

      try {
        await tx.organizationVersion.create({ data })
        console.log(`Créé avec studies + users + onboarder : ${org.name}`)
      } catch (e) {
        console.error(`Erreur sur ${org.name} :`, e)
      }
    })
  }
}

const secondPassUpdateParents = async () => {
  const organizations = await prisma.organization.findMany({
    where: { parentId: { not: null } },
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  })

  for (const org of organizations) {
    await prisma.$transaction(async (tx) => {
      try {
        const childVersion = await tx.organizationVersion.findFirst({
          where: {
            organizationId: org.id,
            environment: defaultEnvironment,
          },
        })

        if (!childVersion) {
          console.warn(`Pas de version pour : ${org.name}`)
          return
        }

        if (!org.parentId) {
          console.log(`Pas de parentId : ${org.name}`)
          return
        }

        await tx.organizationVersion.update({
          where: { id: childVersion.id },
          data: {
            parent: {
              connect: {
                organizationId_environment: {
                  organizationId: org.parentId,
                  environment: defaultEnvironment,
                },
              },
            },
          },
        })

        console.log(`Parent connecté pour : ${org.name}`)
      } catch (e) {
        console.error(`Erreur de parent pour ${org.name} :`, e)
      }
    })
  }
}

const migrateOrganizationToVersionInTwoSteps = async () => {
  await firstPassCreateVersions()
  await secondPassUpdateParents()
  console.log('Migration en deux passes terminée.')
}

const migrateAll = async () => {
  await migrateUsersToAccounts()
  await migrateOrganizationToVersionInTwoSteps()
}

migrateAll()
