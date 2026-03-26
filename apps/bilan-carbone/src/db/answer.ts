import { ID_INTERN_PREFIX_REGEX } from '@/constants/utils'
import { prismaClient } from './client'

export const deleteAnswerKeysByRow = async (idIntern: string, indexToDelete: string) => {
  const cleanedIdIntern = idIntern.replace(ID_INTERN_PREFIX_REGEX, '')
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
