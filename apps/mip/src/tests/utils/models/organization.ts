export const mockedOrganizationId = 'mocked-organization-id'
export const mockedOrganizationVersionMipId = 'mocked-organization-version-mip-id'

export const mockedOrganization = {
  id: mockedOrganizationId,
  name: 'Mocked Organization',
}

export const mockedOrganizationVersionMip = {
  id: mockedOrganizationVersionMipId,
  organizationId: mockedOrganizationId,
  name: 'Mocked Organization Version',
  organization: mockedOrganization,
}
