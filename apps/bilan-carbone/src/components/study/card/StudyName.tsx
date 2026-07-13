'use client'

import StyledChip from '@/components/base/StyledChip'
import SpaIcon from '@mui/icons-material/Spa'
import { useTranslations } from 'next-intl'

interface Props {
  studyId: string
  name: string
  role: string | null
  clickable?: boolean
}

const StudyName = ({ studyId, name, role, clickable = false }: Props) => {
  const tRole = useTranslations('study.role')

  return (
    <StyledChip
      color="success"
      data-testid="study-name-chip"
      label={name}
      subtitle={role ? tRole(role) : undefined}
      icon={<SpaIcon />}
      roleClass={role ? role.toLowerCase() : 'validator'} // For env without role default to green design
      component="a"
      href={`/etudes/${studyId}?showHome=true`}
      clickable={clickable}
    />
  )
}

export default StudyName
