import { Environment } from '@prisma/client'
import Image from 'next/image'

type LogoConfig = {
  src: string
  alt: string
  width: number
  height: number
}

interface Props {
  environment?: Environment
}

export const Logo = ({ environment }: Props) => {
  const logosPerEnvironment: Record<string, LogoConfig[]> = {
    [Environment.CUT]: [{ src: '/logos/cut/logo.svg', alt: 'Logo de COUNT', width: 98, height: 48 }],
    [Environment.TILT]: [
      { src: '/logos/abc/logo_abc_base.png', alt: 'Logo ABC', width: 84, height: 28 },
      { src: '/logos/tilt/logo_tilt.svg', alt: 'Logo TILT', width: 82, height: 28 },
    ],
    [Environment.CLICKSON]: [{ src: '/logos/clickson/logo_clickson.png', alt: 'Logo Clickson', width: 98, height: 70 }],
    DEFAULT: [
      {
        src: '/logos/logo_bc_2025_blanc_nospace.png',
        alt: 'Logo de bilan carbone 2025',
        width: 100,
        height: 35,
      },
    ],
  }

  const logos = (environment && logosPerEnvironment[environment]) ?? logosPerEnvironment.DEFAULT

  return (
    <div className="h100 align-center gapped1">
      {logos.map(({ src, alt, width, height }) => (
        <Image key={src} data-testid={`logo-${environment}`} src={src} alt={alt} width={width} height={height} />
      ))}
    </div>
  )
}
