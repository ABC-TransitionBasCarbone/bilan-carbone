'use client';

import { useAppEnvironmentStore } from "@/store/AppEnvironment";
import Image from "next/image";

type LogoConfig = {
    src: string;
    alt: string;
}

export const Logo = () => {
    const { environment } = useAppEnvironmentStore();

    const logos: Record<string, LogoConfig> = {
        cut: { src: '/logos/cut/logo.svg', alt: 'Logo de COUNT' },
        default: { src: '/logos/logo_BC_2025_blanc.png', alt: 'Logo de bilan carbone 2025' }
    }
    const { src, alt } = logos[environment] ?? logos['default'];

    return <Image src={src} alt={alt} width={98} height={48} />;
}