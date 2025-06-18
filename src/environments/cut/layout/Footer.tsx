'use client'
import { Box, Grid, Typography, useTheme } from '@mui/material'
import { common } from '@mui/material/colors'
import Image from 'next/image'
import styles from './Footer.module.css'

const Footer = () => {
  const { palette } = useTheme()
  const size = { xs: 12, sm: 6, md: 6, lg: 3 }
  return (
    <Grid container spacing={2} columnGap={2} paddingY={2} minHeight="236px" bgcolor={palette.grey[500]}>
      <Grid display="flex" justifyContent="center" alignItems="center" size={size}>
        <Box className="flex-col" gap={2}>
          <Typography className={styles.text} color={common.white}>
            Cet outil a été développé par l'association
          </Typography>
          <Box display="flex">
            <Image width={86.23} height={55} src="/logos/cut/CUT.svg" alt="Cut Logo" />
            <Image width={58.95} height={44.76} src="/logos/cut/CUT_Acronyme.svg" alt="Cinéma uni pour la transition" />
          </Box>
        </Box>
      </Grid>
      <Grid display="flex" justifyContent="center" alignItems="center" size={size}>
        <Box component="article" className="flex-col" gap={2}>
          <Typography className={styles.text} color={common.white}>
            En coopération avec l'ABC,
            <br />
            association pour la transition bas carbone
          </Typography>
          <Image width={154} height={55} src="/logos/cut/ABC.svg" alt="ABC Logo" />
        </Box>
      </Grid>
      <Grid display="flex" justifyContent="center" alignItems="center" size={size}>
        <Box component="article" className="flex align-center" gap={2}>
          <Image width={92} height={90} src="/logos/cut/France3_2025_blanc.png" alt="Logo de France 3" />
          <Typography className={styles.text} color={common.white}>
            Opération soutenue par l’État dans le cadre du <br />
            dispositif « Soutenir les alternatives vertes 2 » <br />
            de France 2030, opéré par la Banque des <br />
            territoires (Caisse des Dépôts)
          </Typography>
        </Box>
      </Grid>
      <Grid display="flex" justifyContent="center" alignItems="center" size={size}>
        <Box component="article" className="flex-col" gap={2}>
          <Typography className={styles.text} color={common.white}>
            CUT! bénéficie du soutien du CNC
          </Typography>
          <Image width={172} height={37} src="/logos/cut/CNC.svg" alt="CNC Logo" />
        </Box>
      </Grid>
    </Grid>
  )
}

export default Footer
