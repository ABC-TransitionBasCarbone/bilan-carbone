'use client'
import StyledChip from '@/components/base/StyledChip'
import SpaIcon from '@mui/icons-material/Spa'
import { Tooltip } from '@mui/material'
import { styled } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'

interface Props {
  name: string
}

const TruncatedChip = styled(StyledChip)({
  maxWidth: '100%',
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}) as typeof StyledChip

const StudyName = ({ name }: Props) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const chipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chipRef.current) {
      const labelElement = chipRef.current.querySelector('.MuiChip-label')
      if (labelElement) {
        setShowTooltip(labelElement.scrollWidth > labelElement.clientWidth)
      }
    }
  }, [name])

  const chip = <TruncatedChip ref={chipRef} color="success" label={name} icon={<SpaIcon />} />

  return showTooltip ? (
    <Tooltip title={name} arrow>
      {chip}
    </Tooltip>
  ) : (
    chip
  )
}

export default StudyName
