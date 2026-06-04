export const AccountMipWithUserSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  status: true,
  organizationVersionMipId: true,
  organizationVersionMip: {
    select: {
      id: true,
      organizationId: true,
    },
  },
  role: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      password: true,
      resetToken: true,
      source: true,
    },
  },
}
