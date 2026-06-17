'use client'

import { Box, Typography } from '@mui/material'
import { ReactNode } from 'react'
import styles from './ObjectiveEncart.module.css'

interface Props {
  nationalTarget: string
  nationalTargetDescription: string
  youLabel: string
  footprintValue: string
  unit: string
  aboveTargetMessage?: string
  paceTitle?: string
  paceValue?: string
  paceUnit?: string
  chart: ReactNode
}

const ObjectiveEncart = ({
  nationalTarget,
  nationalTargetDescription,
  youLabel,
  footprintValue,
  unit,
  aboveTargetMessage,
  paceTitle,
  paceValue,
  paceUnit,
  chart,
}: Props) => {
  return (
    <Box component="section" className={styles.encart}>
      <Box className={styles.header}>
        <Typography className={styles.targetBadge}>{nationalTarget}</Typography>
        <Typography className={styles.headerDescription}>{nationalTargetDescription}</Typography>
      </Box>

      <Box className={styles.body}>
        <Box className={styles.userSection}>
          <Typography className={styles.youLabel}>{youLabel}</Typography>
          <Typography className={styles.footprintValue}>
            {footprintValue}
            <Box component="span" className={styles.footprintUnit}>
              {' '}
              {unit}
            </Box>
          </Typography>

          {aboveTargetMessage && <Typography className={styles.contextMessage}>{aboveTargetMessage}</Typography>}

          {paceTitle && paceValue && paceUnit && (
            <Box className={styles.paceBox}>
              <Typography className={styles.paceTitle}>{paceTitle}</Typography>
              <Typography className={styles.paceValue}>
                {paceValue}
                <Box component="span" className={styles.paceUnit}>
                  {' '}
                  {paceUnit}
                </Box>
              </Typography>
            </Box>
          )}
        </Box>

        <Box className={styles.chartSection}>{chart}</Box>
      </Box>
    </Box>
  )
}

export default ObjectiveEncart
