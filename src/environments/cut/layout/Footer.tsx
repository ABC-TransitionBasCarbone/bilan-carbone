'use client'
import { Box, Grid, Typography, useTheme } from '@mui/material'
import { common } from '@mui/material/colors'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import styles from './Footer.module.css'

const Footer = () => {
  const { palette } = useTheme()
  const t = useTranslations('footer.message')
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
          <Typography className={styles.text} color={common.white}>
            {t('0')}
          </Typography>
          <Box display="flex">
            <Image width={86.23} height={55} src="/logos/cut/CUT.svg" alt="Cut Logo" />
            <Image width={58.95} height={44.76} src="/logos/cut/CUT_Acronyme.svg" alt="Cinéma uni pour la transition" />
          </Box>
        </Box>
      </Grid>
      <Grid className="flex justify-center align-center" size={size}>
        <Box component="article" className="flex-col" gap={2}>
          <Typography className={styles.text} color={common.white}>
            {t.rich('1', { br: () => <br /> })}
          </Typography>
          <Image width={154} height={55} src="/logos/cut/ABC.svg" alt="ABC Logo" />
        </Box>
      </Grid>
      <Grid className="flex justify-center align-center" size={size}>
        <Box component="article" className="flex align-center" gap={2}>
          <Image width={92} height={90} src="/logos/cut/France3_2025_blanc.png" alt="Logo de France 3" />
          <Typography className={styles.text} color={common.white}>
            {t.rich('2', { br: () => <br /> })}
          </Typography>
        </Box>
      </Grid>
      <Grid className="flex justify-center align-center" size={size}>
        <Box component="article" className="flex-col" gap={2}>
          <Typography className={styles.text} color={common.white}>
            {t('3')}
          </Typography>
          <Image width={172} height={37} src="/logos/cut/CNC.svg" alt="CNC Logo" />
        </Box>
      </Grid>
    </Grid>
  )
}

export default Footer
