import { Environment } from '@prisma/client'

export const mockedOrganizationId = 'mocked-organization-id'
export const mockedOrganizationVersionId = 'mocked-organization-version-id'

export const mockedSite = {
  id: 'mocked-site-id',
  name: 'Mocked Site',
  organizationId: mockedOrganizationId,
  etp: 1,
  ca: 1,
}

export const mockedDbSite = {
  ...mockedSite,
  postalCode: null,
  city: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
}

export const mockedOrganization = {
  id: mockedOrganizationId,
  name: 'Mocked Organization',
}

export const mockedOrganizationVersion = {
  id: mockedOrganizationVersionId,
  organizationId: mockedOrganizationId,
  name: 'Mocked Organization Version',
  isCR: true,
  parentId: null,
  parent: null,
  organization: mockedOrganization,
  environment: Environment.BC,
  activatedLicence: [2025],
}
