'use client'

import { Box, Typography } from '@mui/material'
import styles from './CollectiveEffortEncart.module.css'

export type CollectiveEffortTone = 'state' | 'collectivities' | 'companies'

export interface CollectiveEffortEncartItem {
  key: string
  label: string
  description: string
  tone: CollectiveEffortTone
}

interface Props {
  title: string
  items: CollectiveEffortEncartItem[]
}

const CollectiveEffortEncart = ({ title, items }: Props) => {
  return (
    <Box component="section" className={styles.encart}>
      <Typography className={styles.title}>{title}</Typography>
      <Box className={styles.grid}>
        {items.map((item) => (
          <Box key={item.key} className={styles.column}>
            <Box className={`${styles.badge} ${styles[item.tone]}`}>{item.label}</Box>
            <Typography className={styles.description}>{item.description}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default CollectiveEffortEncart
