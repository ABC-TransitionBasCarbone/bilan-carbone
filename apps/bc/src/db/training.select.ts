import type { Prisma } from '@abc-transitionbascarbone/common/db'

export const CourseAccountSelect = {
  professorCourseSessions: { select: { id: true } },
  traineeCourseSessions: {
    select: { courseSession: { select: { startDate: true, endDate: true } } },
  },
} satisfies Prisma.AccountSelect
