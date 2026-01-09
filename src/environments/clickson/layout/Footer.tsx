'use client'
import { Grid, useTheme } from '@mui/material'
import classNames from 'classnames'
import Image from 'next/image'
import styles from './Footer.module.css'

const Footer = () => {
  const { palette } = useTheme()
  const size = { xs: 12, sm: 6, md: 6, lg: 4 }
  return (
    <Grid
      className={classNames('flex justify-around align-center', styles.container)}
      columnGap={2}
      container
      spacing={2}
      bgcolor={palette.grey[500]}
    >
      <Grid className="flex justify-between align-center" size={size}>
        <Image width={153} height={56} src="/logos/clickson/erasmus.png" alt="Erasmus" />

        <Image width={210} height={46} src="/logos/clickson/EU.png" alt="EU" />

        <Image width={70} height={68} src="/logos/clickson/bonne_pratique.png" alt="Bonne Pratique" />
      </Grid>

      <Grid className="flex justify-center align-center" size={size}>
        <Image width={180} height={89} src="/logos/clickson/ADEME.png" alt="ADEME" />
      </Grid>
    </Grid>
  )
}

export default Footer
