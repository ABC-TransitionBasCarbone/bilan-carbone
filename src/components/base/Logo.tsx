import { Environment } from '@prisma/client'
import Image from 'next/image'

type LogoConfig = {
  src: string
  alt: string
}

interface Props {
  environment: Environment
}

export const Logo = ({ environment }: Props) => {
  const logos: Record<string, LogoConfig> = {
    [Environment.CUT]: { src: '/logos/cut/logo.svg', alt: 'Logo de COUNT' },
    [Environment.BC]: { src: '/logos/logo_BC_2025_blanc.png', alt: 'Logo de bilan carbone 2025' },
  }
  const { src, alt } = logos[typeof environment === 'string' && environment in logos ? environment : Environment.BC]

  return <Image src={src} alt={alt} width={98} height={48} />
}
