import { Objective, Prisma, PrismaClient, Trajectory } from '@prisma/client'

const prisma = new PrismaClient()

export type TrajectoryWithObjectives = Trajectory & {
  objectives: Objective[]
}

export const createTrajectoryWithObjectives = async (data: Prisma.TrajectoryCreateInput) =>
  prisma.trajectory.create({
    data,
  })

export const getTrajectoryById = async (id: string): Promise<TrajectoryWithObjectives | null> => {
  return prisma.trajectory.findUnique({
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
  return prisma.trajectory.findMany({
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
  const count = await prisma.trajectory.count({
    where: { transitionPlanId },
  })
  return count > 0
}

export const deleteTrajectory = async (id: string): Promise<void> => {
  await prisma.trajectory.delete({
    where: { id },
  })
}
