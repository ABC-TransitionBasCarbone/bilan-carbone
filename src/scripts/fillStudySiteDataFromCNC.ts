'use server'

import { prismaClient } from '@/db/client'
import { mapCncToStudySite } from '@/utils/cnc'

const fillStudySiteDataFromCNC = async () => {
  try {
    console.log('Starting CNC data backfill process...')

    // Find all study sites that have CNC data but missing fields
    const studySites = await prismaClient.studySite.findMany({
      where: {
        site: {
          cnc: {
            isNot: null,
          },
        },
        OR: [
          { distanceToParis: null },
          { numberOfSessions: null },
          { numberOfTickets: null },
          { numberOfOpenDays: null },
        ],
      },
      include: {
        site: {
          include: {
            cnc: {
              select: {
                id: true,
                latitude: true,
                longitude: true,
                seances: true,
                entrees2023: true,
                semainesActivite: true,
              },
            },
          },
        },
      },
    })

    console.log(`Found ${studySites.length} study sites to update`)

    if (studySites.length === 0) {
      console.log('No study sites need CNC data backfill.')
      return
    }

    let updatedCount = 0

    // Process each study site
    for (const studySite of studySites) {
      const cncData = studySite.site.cnc
      if (!cncData) {
        continue
      }

      const updateData = mapCncToStudySite(cncData, studySite)

      // Only update if we have changes
      if (Object.keys(updateData).length > 0) {
        await prismaClient.studySite.update({
          where: { id: studySite.id },
          data: updateData,
        })

        updatedCount++
        console.log(`✓ Updated study site ${studySite.id}`)
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} study sites with CNC data`)
  } catch (error) {
    console.error('❌ Error filling CNC data:', error)
    throw error
  } finally {
    await prismaClient.$disconnect()
  }
}

// Run the script if called directly
if (require.main === module) {
  fillStudySiteDataFromCNC()
    .then(() => {
      console.log('🎉 CNC data backfill completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 CNC data backfill failed:', error)
      process.exit(1)
    })
}

export { fillStudySiteDataFromCNC }
