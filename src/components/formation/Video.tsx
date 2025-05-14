'use client'

import { Formation } from '@prisma/client'
import dynamic from 'next/dynamic'
import Box from '../base/Box'

interface Props {
  formation: Formation
}

const ReactPlayer = dynamic(() => import('react-player/youtube'), { ssr: false })

const Video = ({ formation }: Props) => (
  <Box>
    <div className="justify-center mb-2">{formation.name}</div>
    <ReactPlayer url={formation.link} controls />
  </Box>
)

export default Video
