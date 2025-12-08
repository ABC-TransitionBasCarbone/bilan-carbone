'use client'
import StyledChip from '@/components/base/StyledChip'
import SpaIcon from '@mui/icons-material/Spa'

interface Props {
  name: string
  role?: string
}

const StudyName = ({ name, role }: Props) => {
  return <StyledChip color="success" label={name} subtitle={role} icon={<SpaIcon />} />
}

export default StudyName
