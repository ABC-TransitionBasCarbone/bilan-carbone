/**
 * Migration script to link existing CNC records to the default 2023 version
 *
 * This script:
 * 1. Creates CncVersion for 2023 if it doesn't exist
 * 2. Links all existing CNC records without a version to the 2023 version
 * 3. Links all StudySites without a cncVersion but with CNC-linked sites to the 2023 version
 *
 * Run with: npx tsx src/scripts/migrations/link-existing-cncs-to-version.ts
 */

import { prismaClient } from '@/db/client'
import { getOrCreateCncVersion } from '@/db/cnc'
import { Environment } from '@prisma/client'

const MIGRATION_YEAR = 2023

const linkExistingCncsToVersion = async () => {
  console.log('🚀 Starting CNC version linking migration...')

  try {
    // Step 1: Get or create the 2023 CNC version
    const cncVersion = await getOrCreateCncVersion(MIGRATION_YEAR)

    if (!cncVersion) {
      console.error('❌ Failed to get or create CNC version for year 2023')
      return
    }

    // Step 2: Find CNC records without a version
    const cncsWithoutVersion = await prismaClient.cnc.findMany({
      where: { cncVersionId: null },
    })

    console.log(`📊 Found ${cncsWithoutVersion.length} CNC records without a version`)

    // Step 3: Link them to the 2023 version
    if (cncsWithoutVersion.length > 0) {
      console.log('🔄 Linking existing CNC records to version...')
      const updateResult = await prismaClient.cnc.updateMany({
        where: { cncVersionId: null },
        data: { cncVersionId: cncVersion.id },
      })
      console.log(`✅ Linked ${updateResult.count} CNC records to version ${MIGRATION_YEAR}`)
    }

    // Step 4: Find StudySites without a cncVersion but with CNC-linked sites (CUT environment only)
    const studySitesWithCncButNoVersion = await prismaClient.studySite.findMany({
      where: {
        cncVersionId: null,
        site: {
          cnc: {
            isNot: null,
          },
        },
        study: {
          organizationVersion: {
            environment: Environment.CUT,
          },
        },
      },
      include: {
        site: {
          include: {
            cnc: true,
          },
        },
        study: {
          select: {
            organizationVersion: {
              select: {
                environment: true,
              },
            },
          },
        },
      },
    })

    console.log(`📊 Found ${studySitesWithCncButNoVersion.length} StudySites with CNC data but no version`)

    // Step 5: Link StudySites to the 2023 version
    if (studySitesWithCncButNoVersion.length > 0) {
      console.log('🔄 Linking existing StudySites to CNC version...')
      const updatePromises = studySitesWithCncButNoVersion.map((studySite) =>
        prismaClient.studySite.update({
          where: { id: studySite.id },
          data: { cncVersionId: cncVersion.id },
        }),
      )

      await Promise.all(updatePromises)
      console.log(`✅ Linked ${studySitesWithCncButNoVersion.length} StudySites to version ${MIGRATION_YEAR}`)
    }

    console.log('🎉 CNC version linking migration completed successfully!')

    // Summary
    console.log('\n📋 Migration Summary:')
    console.log(`- CNC version ${MIGRATION_YEAR} is ready`)
    console.log(`- Linked ${cncsWithoutVersion.length} existing CNC records`)
    console.log(`- Linked ${studySitesWithCncButNoVersion.length} existing StudySites`)
    console.log(`- Future CNC imports will automatically use versioning`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prismaClient.$disconnect()
  }
}

linkExistingCncsToVersion()
