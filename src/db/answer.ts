import { prismaClient } from './client'

export const deleteAnswerKeysByRow = async (idIntern: string, indexToDelete: string) => {
  const cleanedIdIntern = idIntern.replace(/^\d+/, '')
  const questions = await prismaClient.question.findMany({
    where: {
      idIntern: {
        contains: cleanedIdIntern,
      },
      type: { not: 'TABLE' },
    },
    include: {
      userAnswers: true,
    },
  })

  for (const question of questions) {
    for (const answer of question.userAnswers) {
      if (typeof answer.response === 'object' && answer.response !== null && !Array.isArray(answer.response)) {
        const responseCopy = { ...answer.response }
        delete responseCopy[indexToDelete]
        console.debug({ responseCopy })
        await prismaClient.answer.update({
          where: {
            questionId_studySiteId: {
              questionId: question.id,
              studySiteId: answer.studySiteId,
            },
          },
          data: {
            response: responseCopy,
          },
        })
      }
    }
  }
}
