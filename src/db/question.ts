import { Answer, Prisma, Question, SubPost } from '@prisma/client'
import { prismaClient } from './client'

export const getAllQuestions = () => prismaClient.question.findMany({})

export const createQuestions = async (data: Prisma.QuestionCreateInput[]) => prismaClient.question.createMany({ data })

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
  emissionSourceId?: string,
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
      emissionSourceId
    },
    create: {
      questionId,
      studySiteId,
      response,
      emissionSourceId,
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

export const getQuestionById = async (questionId: string): Promise<Question | null> => {
  return await prismaClient.question.findUnique({
    where: {
      id: questionId,
    },
  })
}
