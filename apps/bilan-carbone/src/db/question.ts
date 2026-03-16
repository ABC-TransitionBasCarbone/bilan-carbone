import { ID_INTERN_PREFIX_REGEX } from '@/constants/utils'
import { Answer, Prisma, Question, SubPost } from '@prisma/client'
import { prismaClient } from './client'

export const getAllQuestions = () => prismaClient.question.findMany({})

export const upsertQuestions = async (data: Prisma.QuestionCreateInput[]) => {
  await Promise.all(
    data.map((question) =>
      prismaClient.question.upsert({
        where: { idIntern: question.idIntern },
        update: question,
        create: question,
      }),
    ),
  )
}

export const getQuestionsBySubPost = async (subPost: SubPost): Promise<Question[]> => {
  return await prismaClient.question.findMany({
    where: {
      subPost: subPost,
    },
    orderBy: {
      order: 'asc',
    },
  })
}

export const getAnswerByQuestionId = async (questionId: string, studySiteId: string): Promise<Answer | null> => {
  return await prismaClient.answer.findFirst({
    where: {
      questionId,
      studySiteId,
    },
    include: {
      question: true,
    },
  })
}

export const getAnswersByStudyAndSubPost = async (studySiteId: string, subPost: SubPost): Promise<Answer[]> => {
  return await prismaClient.answer.findMany({
    where: {
      studySiteId,
      question: {
        subPost: subPost,
      },
    },
    include: {
      question: true,
    },
  })
}

export const saveAnswer = async (
  questionId: string,
  studySiteId: string,
  response: Prisma.InputJsonValue,
): Promise<Answer> => {
  return await prismaClient.answer.upsert({
    where: {
      questionId_studySiteId: {
        questionId,
        studySiteId,
      },
    },
    update: {
      response,
    },
    create: {
      questionId,
      studySiteId,
      response,
    },
  })
}

export const deleteAnswer = async (
  questionId: string,
  studySiteId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prismaClient.answer.deleteMany({
      where: {
        questionId,
        studySiteId,
      },
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export const getQuestionByIdIntern = async (idIntern: string): Promise<Question | null> => {
  return await prismaClient.question.findUnique({
    where: {
      idIntern,
    },
  })
}

export const getQuestionById = async (questionId: string): Promise<Question | null> => {
  return await prismaClient.question.findUnique({
    where: {
      id: questionId,
    },
  })
}

export const getQuestionsByIdIntern = async (
  idIntern: string,
): Promise<Prisma.QuestionGetPayload<{ include: { userAnswers: true } }>[]> => {
  const parseIdItern = idIntern.replace(ID_INTERN_PREFIX_REGEX, '')
  if (!parseIdItern) {
    return []
  }
  return await prismaClient.question.findMany({
    where: {
      idIntern: {
        contains: parseIdItern,
      },
    },
    include: {
      userAnswers: true,
    },
    orderBy: {
      order: 'asc',
    },
  })
}

export const findAnswerEmissionSourceByAnswerAndRow = async (answerId: string, rowId: string, emissionType: string) => {
  return await prismaClient.answerEmissionSource.findFirst({
    where: {
      answerId,
      rowId,
      emissionType,
    },
  })
}

export const findAnswerEmissionSourceByAnswer = async (answerId: string) => {
  return await prismaClient.answerEmissionSource.findFirst({
    where: {
      answerId,
    },
  })
}

export const upsertAnswerEmissionSource = async (
  answerId: string,
  rowId: string,
  emissionType: string,
  emissionSourceId: string,
) => {
  return await prismaClient.answerEmissionSource.upsert({
    where: {
      answerId_rowId_emissionType: {
        answerId,
        rowId,
        emissionType,
      },
    },
    update: {
      emissionSourceId,
    },
    create: {
      answerId,
      emissionSourceId,
      rowId,
      emissionType,
    },
  })
}

export const updateAnswerEmissionSource = async (id: string, emissionSourceId: string) => {
  return await prismaClient.answerEmissionSource.update({
    where: { id },
    data: { emissionSourceId },
  })
}

export const updateAnswerEmissionSourceComplete = async (
  id: string,
  emissionSourceId: string,
  rowId: string | null = null,
  emissionType: string | null = null,
) => {
  return await prismaClient.answerEmissionSource.update({
    where: { id },
    data: {
      emissionSourceId,
      rowId,
      emissionType,
    },
  })
}

export const createAnswerEmissionSource = async (
  answerId: string,
  emissionSourceId: string,
  rowId: string | null = null,
  emissionType: string | null = null,
) => {
  return await prismaClient.answerEmissionSource.create({
    data: {
      answerId,
      emissionSourceId,
      rowId,
      emissionType,
    },
  })
}

export const findAnswerEmissionSourcesByAnswerAndRow = async (answerId: string, rowId: string) => {
  return await prismaClient.answerEmissionSource.findMany({
    where: {
      answerId,
      rowId,
    },
  })
}

export const deleteAnswerEmissionSourcesForRow = async (answerId: string, rowId: string) => {
  const entriesToDelete = await findAnswerEmissionSourcesByAnswerAndRow(answerId, rowId)

  await prismaClient.answerEmissionSource.deleteMany({
    where: {
      answerId,
      rowId,
    },
  })

  if (entriesToDelete.length > 0) {
    const emissionSourceIds = entriesToDelete.map((entry) => entry.emissionSourceId)
    await prismaClient.studyEmissionSource.deleteMany({
      where: {
        id: { in: emissionSourceIds },
      },
    })
  }

  return entriesToDelete
}

export const deleteAnswerEmissionSourceById = async (answerEmissionSourceId: string, emissionSourceId: string) => {
  await prismaClient.answerEmissionSource.delete({
    where: { id: answerEmissionSourceId },
  })

  await prismaClient.studyEmissionSource.delete({
    where: { id: emissionSourceId },
  })
}

export const findAnswerEmissionSourceByAnswerAndEmissionSource = async (answerId: string, emissionSourceId: string) => {
  return await prismaClient.answerEmissionSource.findFirst({
    where: {
      answerId,
      emissionSourceId,
    },
  })
}

export const findAllAnswerEmissionSourcesByAnswer = async (answerId: string) => {
  return await prismaClient.answerEmissionSource.findMany({
    where: {
      answerId,
    },
  })
}

export const getAnswerCountByQuestionIdIntern = async (questionIdIntern: string): Promise<number> => {
  return prismaClient.answer.count({
    where: {
      question: { idIntern: questionIdIntern },
    },
  })
}
