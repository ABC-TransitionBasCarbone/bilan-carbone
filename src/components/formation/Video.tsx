import { Formation } from '@prisma/client'
import classNames from 'classnames'
import dynamic from 'next/dynamic'
import Box from '../base/Box'
import styles from './Formation.module.css'

interface Props {
  formation: Formation
}

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

const Video = ({ formation }: Props) => (
  <Box>
    <div className="justify-center mb-2">{formation.name}</div>
    <div className={classNames(styles.videoContainer, 'w100')}>
      <ReactPlayer src={formation.link} controls style={{ width: '100%', height: '100%' }} />
    </div>
  </Box>
)

export default Video
