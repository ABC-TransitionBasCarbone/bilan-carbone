'use client'

import StyledChip from '@/components/base/StyledChip'
import SpaIcon from '@mui/icons-material/Spa'
import { StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'

interface Props {
  studyId: string
  name: string
  role: string | null
}

const getRoleClass = (role: string | null) => {
  if (!role) {
    return undefined
  }

  switch (role) {
    case StudyRole.Validator:
      return 'validator'
    case StudyRole.Editor:
      return 'editor'
    case StudyRole.Reader:
      return 'reader'
    case 'Contributor':
      return 'contributor'
    default:
      return undefined
  }
}

const StudyName = ({ studyId, name, role }: Props) => {
  const tRole = useTranslations('study.role')

  return (
    <StyledChip
      color="success"
      label={name}
      subtitle={role ? tRole(role) : undefined}
      icon={<SpaIcon />}
      roleClass={role ? getRoleClass(role) : 'validator'} // Default to validator if no role
      component="a"
      href={`/etudes/${studyId}`}
      clickable
    />
  )
}

export default StudyName
