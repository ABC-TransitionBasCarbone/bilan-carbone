'use client'
import { Box, Grid, useTheme } from '@mui/material'
import classNames from 'classnames'
import Image from 'next/image'
import styles from './Footer.module.css'

const Footer = () => {
  const { palette } = useTheme()
  const size = { xs: 12, sm: 6, md: 6, lg: 3 }
  return (
    <Grid
      className={classNames('flex justify-center align-center', styles.container)}
      container
      spacing={2}
      columnGap={2}
      paddingY={2}
      bottom={0}
      bgcolor={palette.grey[500]}
    >
      <Grid className="flex justify-center align-center" size={size}>
        <Box className="flex-col" gap={2}>
          <Box display="flex">
            <Image width={150} height={95.7} src="/logos/cut/CUT.svg" alt="Cut Logo" />
          </Box>
        </Box>
      </Grid>
      <Grid className="flex justify-center align-center" size={size}>
        <Box component="article" className="flex-col" gap={2}>
          <Image width={154} height={55} src="/logos/cut/ABC.svg" alt="ABC Logo" />
        </Box>
      </Grid>
      <Grid className="flex justify-center align-center" size={size}>
        <Box component="article" className="flex align-center" gap={2}>
          <Image width={92} height={90} src="/logos/cut/France3_2025_blanc.png" alt="Logo de France 3" />
        </Box>
      </Grid>
      <Grid className="flex justify-center align-center" size={size}>
        <Box component="article" className="flex-col" gap={2}>
          <Image width={172} height={37} src="/logos/cut/CNC.svg" alt="CNC Logo" />
        </Box>
      </Grid>
    </Grid>
  )
}

export default Footer
