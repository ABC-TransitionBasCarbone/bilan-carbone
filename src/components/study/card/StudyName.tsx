'use client'
import StyledChip from '@/components/base/StyledChip'
import SpaIcon from '@mui/icons-material/Spa'

interface Props {
  name: string
  className?: string
}

const StudyName = ({ name, className }: Props) => {
  return <StyledChip color="success" label={name} icon={<SpaIcon />} className={className} />
}

export default StudyName
