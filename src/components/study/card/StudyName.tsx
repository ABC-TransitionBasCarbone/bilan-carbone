'use client'
import StyledChip from '@/components/base/StyledChip'
import SpaIcon from '@mui/icons-material/Spa'

interface Props {
  name: string
}

const StudyName = ({ name }: Props) => <StyledChip color="success" label={name} icon={<SpaIcon />} />

export default StudyName
