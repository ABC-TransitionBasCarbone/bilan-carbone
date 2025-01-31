import { Prisma, PrismaClient, User } from '@prisma/client'

// https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
const globalForPrisma = global as unknown as {
  prismaClient: PrismaClient | undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deleteUserValue = async (args: any, query: any) => {
  const user = (await query(args)) as User | null
  if (user && (!args || !args.select)) {
    const select = args.select as Prisma.UserSelect
    if (!select || !select.password) {
      user.password = ''
    }
    if (!select || !select.resetToken) {
      user.resetToken = ''
    }
  }
  return user
}

export const prismaClient =
  globalForPrisma.prismaClient ??
  (new PrismaClient().$extends({
    query: {
      user: {
        async findFirst({ args, query }) {
          return deleteUserValue(args, query)
        },
        async findFirstOrThrow({ args, query }) {
          return deleteUserValue(args, query)
        },
        async findUnique({ args, query }) {
          return deleteUserValue(args, query)
        },
        async findUniqueOrThrow({ args, query }) {
          return deleteUserValue(args, query)
        },
        async findMany({ args, query }) {
          const users = await query(args)
          if (!args || !args.select) {
            const select = args.select
            return users.map((user) => {
              if (!select || !select.password) {
                user.password = ''
              }
              if (!select || !select.resetToken) {
                user.resetToken = ''
              }
              return user
            })
          }
          return users
        },
      },
    },
  }) as PrismaClient)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaClient = prismaClient
}
