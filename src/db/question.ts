import { Prisma } from '@prisma/client'
import { prismaClient } from './client'

export const getAllQuestions = () => prismaClient.question.findMany({})

export const createQuestions = async (data: Prisma.QuestionCreateInput[]) => prismaClient.question.createMany({ data })
