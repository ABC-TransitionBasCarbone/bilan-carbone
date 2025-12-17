'use client'

import StyledChip from '@/components/base/StyledChip'
import SpaIcon from '@mui/icons-material/Spa'
import { useTranslations } from 'next-intl'

interface Props {
  studyId: string
  name: string
  role: string | null
}

const StudyName = ({ studyId, name, role }: Props) => {
  const tRole = useTranslations('study.role')

  return (
    <StyledChip
      color="success"
      label={name}
      subtitle={role ? tRole(role) : undefined}
      icon={<SpaIcon />}
      roleClass={role ? role.toLowerCase() : 'validator'} // Default to validator if no role
      component="a"
      href={`/etudes/${studyId}`}
      clickable
    />
  )
}

export default StudyName
