import { prismaClient } from '@/db/client'
import { getAnswerCountByQuestionIdIntern, getQuestionByIdIntern } from '@/db/question'
import { getStudiesAffectedByQuestion } from '@/db/study'
import { Command } from 'commander'
import * as readline from 'readline'

interface CleanupStats {
  answersDeleted: number
  answerEmissionSourcesDeleted: number
  emissionSourcesDeleted: number
}

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

function displayStudies(
  studies: {
    id: string
    name: string
  }[],
): void {
  console.log(`\n=== Affected Studies ===`)
  if (studies.length === 0) {
    console.log('No studies will be affected')
  } else {
    console.log(`${studies.length} studies will be affected:`)
    studies.forEach((study, index) => {
      console.log(`${index + 1}. ${study.name} (ID: ${study.id})`)
    })
  }
}

function displayPreview(answerCount: number): void {
  console.log(`\n=== Preview ===`)
  console.log(`Found ${answerCount} answer(s) to delete`)

  if (answerCount > 0) {
    console.log('\nThis will delete:')
    console.log('1. ALL answers for the specified question')
    console.log('2. Related answer_emission_sources')
    console.log('3. Orphaned study_emission_sources')
  }
}

function displayCleanupSummary(stats: CleanupStats): void {
  console.log('\n=== Cleanup Summary ===')
  console.log(`Answers deleted: ${stats.answersDeleted}`)
  console.log(`Answer emission sources deleted: ${stats.answerEmissionSourcesDeleted}`)
  console.log(`Orphaned emission sources deleted: ${stats.emissionSourcesDeleted}`)
  console.log('Cleanup completed successfully!')
}

async function deleteAnswersWithCleanup(questionIdIntern: string): Promise<CleanupStats> {
  const stats: CleanupStats = {
    answersDeleted: 0,
    answerEmissionSourcesDeleted: 0,
    emissionSourcesDeleted: 0,
  }

  console.log(`Starting cleanup for question: ${questionIdIntern}`)

  await prismaClient.$transaction(async (tx) => {
    const question = await tx.question.findUnique({
      where: { idIntern: questionIdIntern },
      select: { id: true, idIntern: true, label: true },
    })

    if (!question) {
      console.log(`❌ Question with idIntern "${questionIdIntern}" not found!`)
      return
    }

    console.log(`✅ Question found: "${question.label}" (ID: ${question.id})`)

    const answersToDelete = await tx.answer.findMany({
      where: {
        question: { idIntern: questionIdIntern },
      },
      select: { id: true },
    })

    const answerIds = answersToDelete.map((answer) => answer.id)
    console.log(`Found ${answerIds.length} answers to delete`)

    if (answerIds.length === 0) {
      console.log('No answers found to delete')
      return
    }

    const answerEmissionSources = await tx.answerEmissionSource.findMany({
      where: { answerId: { in: answerIds } },
      select: { id: true, emissionSourceId: true },
    })

    const emissionSourceIds = answerEmissionSources.map((aes) => aes.emissionSourceId)
    console.log(`Found ${answerEmissionSources.length} answer_emission_sources to delete`)

    const orphanedEmissionSources = await tx.studyEmissionSource.findMany({
      where: {
        id: { in: emissionSourceIds },
        answerEmissionSources: {
          every: { answerId: { in: answerIds } },
        },
      },
      select: { id: true },
    })

    const orphanedEmissionSourceIds = orphanedEmissionSources.map((es) => es.id)
    console.log(`Found ${orphanedEmissionSourceIds.length} emission sources that will become orphaned`)

    const answerEmissionSourcesResult = await tx.answerEmissionSource.deleteMany({
      where: { answerId: { in: answerIds } },
    })
    stats.answerEmissionSourcesDeleted = answerEmissionSourcesResult.count
    console.log(`Deleted ${stats.answerEmissionSourcesDeleted} answer_emission_sources`)

    if (orphanedEmissionSourceIds.length > 0) {
      const emissionSourcesResult = await tx.studyEmissionSource.deleteMany({
        where: { id: { in: orphanedEmissionSourceIds } },
      })
      stats.emissionSourcesDeleted = emissionSourcesResult.count
      console.log(`Deleted ${stats.emissionSourcesDeleted} orphaned emission sources`)
    }

    const answersResult = await tx.answer.deleteMany({
      where: { id: { in: answerIds } },
    })
    stats.answersDeleted = answersResult.count
    console.log(`Deleted ${stats.answersDeleted} answers`)
  })

  displayCleanupSummary(stats)
  return stats
}

async function showPreviewAndConfirm(questionIdIntern: string): Promise<boolean> {
  const question = await getQuestionByIdIntern(questionIdIntern)

  if (!question) {
    console.log(`❌ Question with idIntern "${questionIdIntern}" not found!`)
    return false
  }

  console.log(`✅ Question found: "${question.label}" (ID: ${question.id})`)

  const [affectedStudies, answerCount] = await Promise.all([
    getStudiesAffectedByQuestion(questionIdIntern),
    getAnswerCountByQuestionIdIntern(questionIdIntern),
  ])

  displayStudies(affectedStudies)
  displayPreview(answerCount)

  if (answerCount === 0) {
    console.log('No answers found to delete. Nothing to do.')
    return false
  }

  return askConfirmation('\n⚠️  Do you want to proceed with the deletion? (y/N): ')
}

const program = new Command()
  .name('delete-answers-with-cleanup')
  .description(
    `Script to delete ALL answers for a specific question and clean up related data.
    
This script will show you a preview of what will be deleted and ask for confirmation before proceeding.
  
USAGE EXAMPLE:
  npx tsx src/scripts/questions/deleteAnswersWithCleanup.ts -q "question-intern-id-here"`,
  )
  .version('1.0.0')
  .requiredOption('-q, --question-id <value>', 'Internal ID of the question whose answers to delete')
  .parse(process.argv)

async function main(): Promise<void> {
  const { questionId } = program.opts()
  console.log(`Question Internal ID: ${questionId}`)

  try {
    const confirmed = await showPreviewAndConfirm(questionId)

    if (!confirmed) {
      console.log('❌ Deletion cancelled.')
      return
    }

    console.log('✅ Proceeding with deletion...\n')
    await deleteAnswersWithCleanup(questionId)
  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

main()
