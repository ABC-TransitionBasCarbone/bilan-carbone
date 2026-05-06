import { Prisma } from '@abc-transitionbascarbone/db-common'

export const OrganizationVersionWithOrganizationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  isCR: true,
  activatedLicence: true,
  onboarded: true,
  onboarderId: true,
  environment: true,
  parentId: true,
  parent: {
    select: {
      activatedLicence: true,
    },
  },
  organization: {
    select: {
      oldBCId: true,
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      importedFileDate: true,
      wordpressId: true,
      sites: {
        select: {
          name: true,
          etp: true,
          ca: true,
          id: true,
          createdAt: true,
          updatedAt: true,
          organizationId: true,
          oldBCId: true,
          postalCode: true,
          city: true,
          volunteerNumber: true,
          beneficiaryNumber: true,
          establishmentId: true,
          establishmentYear: true,
          studentNumber: true,
          academy: true,
          establishmentType: true,
          superficy: true,
          address: true,
          cncId: true,
          country: true,
          cnc: {
            select: {
              cncCode: true,
              seances: true,
              entrees2024: true,
              entrees2023: true,
              semainesActivite: true,
              latitude: true,
              longitude: true,
              cncVersionId: true,
            },
          },
        },
        orderBy: { createdAt: Prisma.SortOrder.asc },
      },
    },
  },
  userAccounts: {
    select: {
      user: {
        select: {
          level: true,
        },
      },
    },
  },
}
