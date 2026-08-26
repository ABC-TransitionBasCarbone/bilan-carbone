'use client'

import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import GlossaryIconModal from '../modals/GlossaryIconModal'

const WasteEmissionFactorModal = () => {
  const t = useTranslations('emissionFactors.table')

  const modalContent = customRich(t, 'wasteModalContent', {
    link1: (children) => (
      <Link
        href="https://www.bilancarbone-methode.com/annexes/annexes/annexe-1-grands-principes-de-comptabilisation-du-bilan-carbone-r#zoom-sur-le-recyclage-des-dechets"
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </Link>
    ),
    link2: (children) => (
      <Link
        href="https://www.plancarbonegeneral.com/perimetre-collaborateurs/locaux/exploitation/dechets/dechets-de-bureau"
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </Link>
    ),
  })

  return (
    <GlossaryIconModal title="wasteModalTitle" label="waste-emission-factor-modal" tModal="emissionFactors.table">
      <p>{modalContent}</p>
    </GlossaryIconModal>
  )
}

export default WasteEmissionFactorModal
