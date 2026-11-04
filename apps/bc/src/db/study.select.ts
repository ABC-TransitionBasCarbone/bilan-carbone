import type { Prisma } from '@abc-transitionbascarbone/common/db'

export const StudyCourseAccessSelect = {
  courseSessionType: true,
  createdBy: {
    select: {
      environment: true,
      user: { select: { firstName: true, lastName: true } },
      organizationVersion: {
        select: {
          traineeCourseSessions: {
            select: {
              courseSession: {
                select: {
                  type: true,
                  environment: true,
                  professorOrganizationVersionId: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.StudySelect

export type StudyCourseAccess = Prisma.StudyGetPayload<{ select: typeof StudyCourseAccessSelect }>
