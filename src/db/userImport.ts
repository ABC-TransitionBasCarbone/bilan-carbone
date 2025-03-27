// TODO : merge this file with user.ts after fixed aliases imports from script files
import { Prisma, Role } from '@prisma/client'
import { prismaClient } from './client'

export const getUserByEmail = (email: string) => prismaClient.user.findUnique({ where: { email } })

export const updateUser = (
  userId: string,
  data: Partial<Prisma.UserCreateInput & { role: Exclude<Role, 'SUPER_ADMIN'> | undefined }>,
) =>
  prismaClient.user.update({
    where: { id: userId },
    data,
  })

export const createUsers = (users: Prisma.UserCreateManyInput[]) =>
  prismaClient.user.createMany({ data: users, skipDuplicates: true })
