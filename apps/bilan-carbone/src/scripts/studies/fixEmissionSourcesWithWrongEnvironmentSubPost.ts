import { prismaClient } from '@/db/client.server'
import { getValidSubPostsForEnvironment } from '@/utils/importEmissionSources.utils'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'

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

    for (const environment of [Environment.BC, Environment.TILT]) {
      const envStudies = await prismaClient.study.findMany({
        where: {
          organizationVersion: { environment },
          simplified: false,
        },
        select: {
          id: true,
          name: true,
          emissionSources: {
            select: { id: true, name: true, subPost: true },
          },
        },
      })

      console.log(`Found ${envStudies.length} studies for BC to check`)

      const envInvalidSources = await prismaClient.studyEmissionSource.findMany({
        where: {
          studyId: { in: envStudies.map((s) => s.id) },
          subPost: { notIn: Array.from(getValidSubPostsForEnvironment(environment)) },
        },
        select: {
          study: { select: { id: true, name: true } },
          id: true,
          name: true,
          subPost: true,
        },
      })

      if (envInvalidSources.length === 0) {
        console.log('✅ No emission sources found with invalid subposts for their study environment.')
        return
      }

      console.log(`\n⚠️  Found ${envInvalidSources.length} emission source(s) with invalid subposts:\n`)
      for (const source of envInvalidSources) {
        console.log(
          `  Study "${source.study.name}" (${source.study.id}) [${environment}]: ` +
            `source "${source.name}" (${source.id}) has subPost "${source.subPost}"`,
        )
      }

      if (dryRun) {
        console.log('\n🔍 Dry run complete. Run with --fix to delete these emission sources.')
        return
      }

      const idsToDelete = envInvalidSources.map((s) => s.id)
      await prismaClient.studyEmissionSource.deleteMany({
        where: { id: { in: idsToDelete } },
      })

      console.log(`\n✅ Deleted ${idsToDelete.length} emission source(s) with invalid subposts.`)
    }
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
