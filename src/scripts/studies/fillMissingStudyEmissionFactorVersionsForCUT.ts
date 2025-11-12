'use server'

import { prismaClient } from '@/db/client'
import { getSourceCutImportVersionIds } from '@/db/study'
import { Environment, Prisma } from '@prisma/client'

/**
 * Script to populate missing StudyEmissionFactorVersion entries for CUT studies.
 * Related to this issue: https://github.com/ABC-TransitionBasCarbone/bilan-carbone/issues/1952
 */
const fillMissingStudyEmissionFactorVersionsForCUT = async () => {
  try {
    console.log('Starting CUT studies StudyEmissionFactorVersion backfill process...')

    const cutStudies = await prismaClient.study.findMany({
      where: {
        organizationVersion: {
          environment: Environment.CUT,
        },
      },
      select: {
        id: true,
        name: true,
        emissionFactorVersions: {
          select: {
            id: true,
            source: true,
          },
        },
      },
    })

    console.log(`Found ${cutStudies.length} CUT studies`)

    const studiesMissingVersions = cutStudies.filter((study) => study.emissionFactorVersions.length === 0)

    console.log(`Found ${studiesMissingVersions.length} CUT studies missing emission factor versions`)

    if (studiesMissingVersions.length === 0) {
      console.log('✅ All CUT studies already have their emission factor versions.')
      return
    }

    const cutImportVersions = await getSourceCutImportVersionIds()
    console.log(`Found ${cutImportVersions.length} CUT import versions:`)
    cutImportVersions.forEach((version) => {
      console.log(`  - Source: ${version.source}, ID: ${version.id}`)
    })

    if (cutImportVersions.length === 0) {
      console.warn('⚠️  No CUT import versions found. Cannot proceed.')
      return
    }

    let createdCount = 0
    let totalCreated = 0

    await prismaClient.$transaction(async (tx) => {
      for (const study of studiesMissingVersions) {
        const studyEmissionFactorVersions: Prisma.StudyEmissionFactorVersionCreateManyInput[] = cutImportVersions.map(
          (importVersion) => ({
            studyId: study.id,
            source: importVersion.source,
            importVersionId: importVersion.id,
          }),
        )

        await tx.studyEmissionFactorVersion.createMany({
          data: studyEmissionFactorVersions,
        })

        createdCount++
        totalCreated += studyEmissionFactorVersions.length
        console.log(
          `✓ Created ${studyEmissionFactorVersions.length} emission factor versions for study "${study.name}" (${study.id})`,
        )
      }
    })

    console.log(
      `\n✅ Successfully processed ${createdCount} studies and created ${totalCreated} emission factor version entries`,
    )
  } catch (error) {
    console.error('❌ Error filling StudyEmissionFactorVersions:', error)
    throw error
  } finally {
    await prismaClient.$disconnect()
  }
}

if (require.main === module) {
  fillMissingStudyEmissionFactorVersionsForCUT()
    .then(() => {
      console.log('🎉 StudyEmissionFactorVersion backfill completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 StudyEmissionFactorVersion backfill failed:', error)
      process.exit(1)
    })
}

export { fillMissingStudyEmissionFactorVersionsForCUT }
