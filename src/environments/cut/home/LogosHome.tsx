'use client'
import { CUT, useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Box } from '@mui/material'
import Image from 'next/image'
import { useMemo } from 'react'
import styles from './LogosHome.module.css'

const logos = [
  { src: '/logos/cut/Republique_francaise.png', alt: 'Logo de la république française' },
  { src: '/logos/cut/France3_2025.png', alt: 'Logo de france 3' },
  { src: '/logos/cut/Banques_des_Territoires.png', alt: 'Logo du groupe la caisse des dépots' },
]

const LogosHome = () => {
  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])
  return (
    isCut && (
      <Box className={styles.container}>
        {logos.map((logo, i) => (
          <Box key={i} className={styles.list}>
            <Image
              src={logo.src}
              alt={logo.alt}
              className={styles.image}
              sizes="(max-width: 768px) 100vw, 33vw"
              quality={90}
              width={400}
              height={100}
            />
          </Box>
        ))}
      </Box>
    )
  )
}

export default LogosHome
