import { prismaClient } from '@/db/client.server'
import { getValidSubPostsForEnvironment } from '@/utils/importEmissionSources.utils'
import { Environment, SubPost } from '@abc-transitionbascarbone/db-common/enums'

/**
 * Cleanup script for emission sources assigned to subposts that do not belong
 * to their study's environment (e.g. TILT subposts in a BC study).
 * Related to: https://github.com/ABC-TransitionBasCarbone/bilan-carbone/issues/3095
 *
 * Run with --dry-run (default) to only report affected records.
 * Run with --fix to delete affected emission sources from the database.
 *
 * Usage:
 *   yarn tsx src/scripts/studies/fixEmissionSourcesWithWrongEnvironmentSubPost.ts
 *   yarn tsx src/scripts/studies/fixEmissionSourcesWithWrongEnvironmentSubPost.ts --fix
 */

const fixEmissionSourcesWithWrongEnvironmentSubPost = async (dryRun = true) => {
  try {
    console.log(`Starting emission sources subpost environment check (${dryRun ? 'DRY RUN' : 'FIX MODE'})...`)

    const studies = await prismaClient.study.findMany({
      where: {
        organizationVersion: {
          environment: { in: Object.values(Environment) },
        },
      },
      select: {
        id: true,
        name: true,
        organizationVersion: {
          select: { environment: true },
        },
        emissionSources: {
          select: { id: true, name: true, subPost: true },
        },
      },
    })

    console.log(`Found ${studies.length} studies to check`)

    const invalidSources: Array<{
      studyId: string
      studyName: string
      environment: Environment
      emissionSourceId: string
      emissionSourceName: string
      subPost: SubPost
    }> = []

    for (const study of studies) {
      const environment = study.organizationVersion.environment as Environment
      const validSubPosts = getValidSubPostsForEnvironment(environment)

      for (const source of study.emissionSources) {
        if (!validSubPosts.has(source.subPost)) {
          invalidSources.push({
            studyId: study.id,
            studyName: study.name,
            environment,
            emissionSourceId: source.id,
            emissionSourceName: source.name,
            subPost: source.subPost as SubPost,
          })
        }
      }
    }

    if (invalidSources.length === 0) {
      console.log('✅ No emission sources found with invalid subposts for their study environment.')
      return
    }

    console.log(`\n⚠️  Found ${invalidSources.length} emission source(s) with invalid subposts:\n`)
    for (const source of invalidSources) {
      console.log(
        `  Study "${source.studyName}" (${source.studyId}) [${source.environment}]: ` +
          `source "${source.emissionSourceName}" (${source.emissionSourceId}) has subPost "${source.subPost}"`,
      )
    }

    if (dryRun) {
      console.log('\n🔍 Dry run complete. Run with --fix to delete these emission sources.')
      return
    }

    const idsToDelete = invalidSources.map((s) => s.emissionSourceId)
    await prismaClient.emissionSource.deleteMany({
      where: { id: { in: idsToDelete } },
    })

    console.log(`\n✅ Deleted ${idsToDelete.length} emission source(s) with invalid subposts.`)
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prismaClient.$disconnect()
  }
}

if (require.main === module) {
  const fix = process.argv.includes('--fix')
  fixEmissionSourcesWithWrongEnvironmentSubPost(!fix)
    .then(() => {
      console.log('🎉 Cleanup completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Cleanup failed:', error)
      process.exit(1)
    })
}

export { fixEmissionSourcesWithWrongEnvironmentSubPost }
