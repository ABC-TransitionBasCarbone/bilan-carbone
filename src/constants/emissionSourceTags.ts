import { Environment } from '@prisma/client'

export const defaultEmissionSourceTags = {
  [Environment.TILT]: [
    { name: 'Périmètre Interne' },
    { name: 'Périmètre Bénévoles' },
    { name: 'Périmètre Bénéficiaires' },
  ],
}
