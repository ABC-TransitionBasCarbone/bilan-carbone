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

export const getAnswersByStudyAndSubPost = async (studyId: string, subPost: SubPost): Promise<Answer[]> => {
  return await prismaClient.answer.findMany({
    where: {
      studyId: studyId,
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
  studyId: string,
  response: Prisma.InputJsonValue,
): Promise<Answer> => {
  return await prismaClient.answer.upsert({
    where: {
      questionId_studyId: {
        questionId,
        studyId,
      },
    },
    update: {
      response,
    },
    create: {
      questionId,
      studyId,
      response,
    },
  })
}

export const deleteAnswer = async (
  questionId: string,
  studyId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    await prismaClient.answer.deleteMany({
      where: {
        questionId,
        studyId,
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
