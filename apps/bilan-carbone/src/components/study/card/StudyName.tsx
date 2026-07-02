'use client'

import StyledChip from '@/components/base/StyledChip'
import SpaIcon from '@mui/icons-material/Spa'
import { useTranslations } from 'next-intl'

interface Props {
  studyId: string
  name: string
  role: string | null
  simplified: boolean
}

const StudyName = ({ studyId, name, role, simplified }: Props) => {
  const tRole = useTranslations('study.role')

  return (
    <StyledChip
      color="success"
      label={name}
      subtitle={role ? tRole(role) : undefined}
      icon={<SpaIcon />}
      roleClass={role ? role.toLowerCase() : 'validator'} // For env without role default to green design
      {...(!simplified
        ? {
            component: 'a',
            href: `/etudes/${studyId}?showHome=true`,
            clickable: true,
          }
        : {
            component: 'div',
          })}
    />
  )
}

export default StudyName
