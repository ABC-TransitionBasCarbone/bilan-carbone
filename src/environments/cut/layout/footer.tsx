'use client'
import { Box, Grid, styled, Typography, TypographyProps, useTheme } from '@mui/material'
import Image from 'next/image'

const StyledTypography = styled(Typography)<TypographyProps>(({ theme }) => ({
    fontWeight: 400,
    fontSize: 13,
    lineHeight: '100%',
    letterSpacing: 0,
    color: theme.palette.common.white,
}))

const Footer = () => {
    const { palette } = useTheme()
    const size = { xs: 12, sm: 6, md: 6, lg: 3 }
    return (
        <Grid container spacing={2} columnGap={2} paddingY={2} minHeight="236px" bgcolor={palette.grey[500]}>
            <Grid display="flex" justifyContent="center" alignItems="center" size={size}>
                <Box className="flex-col" gap={2}>
                    <StyledTypography>Cet outil a été développé par l'association</StyledTypography>
                    <Box display="flex">
                        <Image width={86.23} height={55} src="/logos/cut/CUT.svg" alt="Cut Logo" />
                        <Image width={58.95} height={44.76} src="/logos/cut/CUT_Acronyme.svg" alt="Cinéma uni pour la transition" />
                    </Box>
                </Box>
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={size}>
                <Box component="article" className="flex-col" gap={2}>
                    <StyledTypography>
                        En coopération avec l'ABC,
                        <br />
                        association pour la transition bas carbone
                    </StyledTypography>
                    <Image width={154} height={55} src="/logos/cut/ABC.svg" alt="ABC Logo" />
                </Box>
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={size}>
                <Box component="article" className="flex align-center" gap={2}>
                    <Image width={92} height={90} src="/logos/cut/France3_2025_blanc.png" alt="Logo de France 3" />
                    <StyledTypography>
                        Opération soutenue par l’État dans le cadre du <br />
                        dispositif « Soutenir les alternatives vertes 2 » <br />
                        de France 2030, opéré par la Banque des <br />
                        territoires (Caisse des Dépôts)
                    </StyledTypography>
                </Box>
            </Grid>
            <Grid display="flex" justifyContent="center" alignItems="center" size={size}>
                <Box component="article" className="flex-col" gap={2}>
                    <StyledTypography>CUT! bénéficie du soutien du CNC</StyledTypography>
                    <Image width={172} height={37} src="/logos/cut/CNC.svg" alt="CNC Logo" />
                </Box>
            </Grid>
        </Grid>
    )
}

export default Footer
