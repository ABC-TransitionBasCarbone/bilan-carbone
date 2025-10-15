import { AddActionCommand } from '@/services/serverFunctions/study.command'
import { TransitionPlan, TransitionPlanStudy } from '@prisma/client'
import { prismaClient } from './client'

export type TransitionPlanWithStudies = TransitionPlan & {
  study: {
    id: string
    name: string
    startDate: Date
  }
  transitionPlanStudies: TransitionPlanStudy[]
}

export const getTransitionPlanById = async (id: string): Promise<TransitionPlan | null> => {
  return prismaClient.transitionPlan.findUnique({
    where: { id },
  })
}

export const getTransitionPlanByStudyId = async (studyId: string): Promise<TransitionPlan | null> => {
  return prismaClient.transitionPlan.findUnique({
    where: {
      studyId,
    },
  })
}

export const getOrganizationTransitionPlans = async (
  organizationVersionId: string,
): Promise<TransitionPlanWithStudies[]> => {
  return prismaClient.transitionPlan.findMany({
    where: {
      study: {
        organizationVersionId,
      },
    },
    include: {
      study: {
        select: {
          id: true,
          name: true,
          startDate: true,
        },
      },
      transitionPlanStudies: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const createTransitionPlan = async (studyId: string): Promise<TransitionPlan> => {
  return prismaClient.transitionPlan.create({
    data: {
      studyId,
      transitionPlanStudies: {
        create: {
          studyId,
        },
      },
    },
  })
}

export const hasTransitionPlan = async (studyId: string): Promise<boolean> => {
  const count = await prismaClient.transitionPlan.count({
    where: {
      studyId,
    },
  })
  return count > 0
}

export const createAction = async (data: AddActionCommand) => prismaClient.action.create({ data })

export const getActions = async (studyId: string) => prismaClient.action.findMany({ where: { studyId } })
