import { prismaClient } from '@/db/client'
import { ActionIndicatorType } from '@prisma/client'

async function migrateActionIndicators() {
  console.log('Starting migration of action indicators...')

  const actions = await prismaClient.action.findMany({
    where: {
      OR: [
        { implementationDescription: { not: null } },
        { followUpDescription: { not: null } },
        { performanceDescription: { not: null } },
      ],
    },
    select: {
      id: true,
      implementationDescription: true,
      followUpDescription: true,
      performanceDescription: true,
    },
  })

  console.log(`Found ${actions.length} actions with existing indicators to migrate`)

  let migratedCount = 0

  for (const action of actions) {
    const indicatorsToCreate = []

    if (action.implementationDescription?.trim()) {
      indicatorsToCreate.push({
        actionId: action.id,
        type: ActionIndicatorType.Implementation,
        description: action.implementationDescription,
      })
    }

    if (action.followUpDescription?.trim()) {
      indicatorsToCreate.push({
        actionId: action.id,
        type: ActionIndicatorType.FollowUp,
        description: action.followUpDescription,
      })
    }

    if (action.performanceDescription?.trim()) {
      indicatorsToCreate.push({
        actionId: action.id,
        type: ActionIndicatorType.Performance,
        description: action.performanceDescription,
      })
    }

    if (indicatorsToCreate.length > 0) {
      await prismaClient.actionIndicator.createMany({
        data: indicatorsToCreate,
      })
      migratedCount++
      console.log(`Migrated ${indicatorsToCreate.length} indicator(s) for action ${action.id}`)
    }
  }

  console.log(`Migration completed! Migrated indicators for ${migratedCount} actions.`)
}

migrateActionIndicators()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
