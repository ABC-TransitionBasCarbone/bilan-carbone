import { Objective, Prisma, Trajectory } from '@prisma/client'
import { prismaClient } from './client'

export type TrajectoryWithObjectives = Trajectory & {
  objectives: Objective[]
}

export const createTrajectoryWithObjectives = async (data: Prisma.TrajectoryCreateInput) => {
  return prismaClient.trajectory.create({
    data,
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
  })
}

export const getTrajectoryById = async (id: string): Promise<TrajectoryWithObjectives | null> => {
  return prismaClient.trajectory.findUnique({
    where: { id },
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
  })
}

export const getTrajectoriesByTransitionPlanId = async (
  transitionPlanId: string,
): Promise<TrajectoryWithObjectives[]> => {
  return prismaClient.trajectory.findMany({
    where: { transitionPlanId },
    include: {
      objectives: {
        orderBy: {
          targetYear: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export const hasTrajectory = async (transitionPlanId: string): Promise<boolean> => {
  const count = await prismaClient.trajectory.count({
    where: { transitionPlanId },
  })
  return count > 0
}

export const deleteTrajectory = async (id: string): Promise<void> => {
  await prismaClient.trajectory.delete({
    where: { id },
  })
}
