import { prismaClient } from '@/db/client.server'
import { computeProgress } from '@/services/publicodes/questionProgress'
import { getEnvironmentForSimplifiedStudy } from '@/services/publicodes/simplifiedPublicodesConfig'
import { Situation } from 'publicodes'

type ListLayoutSituations = Partial<Record<string, Array<{ id: string; situation: Situation<string> }>>>

const backfillSimplifiedStudyProgress = async () => {
  console.log('Starting simplified study progress backfill...')

  const situations = await prismaClient.situation.findMany({
    where: {
      studySite: {
        study: {
          simplified: true,
        },
      },
    },
    select: {
      id: true,
      situation: true,
      listLayoutSituations: true,
      studySite: {
        select: {
          study: {
            select: {
              name: true,
              simplified: true,
              organizationVersion: {
                select: { environment: true },
              },
            },
          },
        },
      },
    },
  })

  console.log(`Found ${situations.length} simplified study situations to process`)

  let updatedCount = 0
  let skippedCount = 0

  for (const situation of situations) {
    const { environment } = situation.studySite.study.organizationVersion
    const { simplified } = situation.studySite.study

    const simplifiedEnv = getEnvironmentForSimplifiedStudy(environment, simplified)
    if (!simplifiedEnv) {
      console.log(`⚠ Skipping situation ${situation.id}: environment ${environment} is not simplified`)
      skippedCount++
      continue
    }

    try {
      const { answeredCount, totalCount } = computeProgress(
        simplifiedEnv,
        (situation.situation ?? {}) as Situation<string>,
        (situation.listLayoutSituations ?? {}) as ListLayoutSituations,
      )

      await prismaClient.situation.update({
        where: { id: situation.id },
        data: { answeredCount, totalCount },
      })

      updatedCount++
      console.log(`✓ "${situation.studySite.study.name}": ${answeredCount}/${totalCount}`)
    } catch (error) {
      console.error(`✗ Failed to process situation ${situation.id}:`, error)
      skippedCount++
    }
  }

  console.log(`\n✅ Done: ${updatedCount} updated, ${skippedCount} skipped`)
}

if (require.main === module) {
  backfillSimplifiedStudyProgress()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Backfill failed:', error)
      process.exit(1)
    })
    .finally(() => {
      prismaClient.$disconnect()
    })
}
