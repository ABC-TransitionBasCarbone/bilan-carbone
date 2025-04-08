'use client'

import { Formation } from '@prisma/client'
import ReactPlayer from 'react-player/youtube'
import Box from '../base/Box'

interface Props {
  formation: Formation
}

const Video = ({ formation }: Props) => {
  return (
    <Box>
      <div className="justify-center mb-2">{formation.name}</div>
      <ReactPlayer url={formation.link} style={{ maxWidth: '100%' }} controls />
    </Box>
  )
}

export default Video
