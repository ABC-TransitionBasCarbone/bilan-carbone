'use client'

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { IconButton, Tooltip } from '@mui/material'
import { useTranslations } from 'next-intl'

const WasteEmissionFactorTooltip = () => {
  const t = useTranslations('emissionFactors.table')

  const tooltipContent = t.rich('wasteTooltip', {
    b: (chunks) => <strong>{chunks}</strong>,
    link1: (chunks) => (
      <a
        href="https://www.bilancarbone-methode.com/annexes/annexes/annexe-1-grands-principes-de-comptabilisation-du-bilan-carbone-r#zoom-sur-le-recyclage-des-dechets"
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks}
      </a>
    ),
    link2: (chunks) => (
      <a
        href="https://www.plancarbonegeneral.com/perimetre-collaborateurs/locaux/exploitation/dechets/dechets-de-bureau"
        rel="noopener noreferrer"
        target="_blank"
      >
        {chunks}
      </a>
    ),
  })

  return (
    <Tooltip arrow title={<span>{tooltipContent}</span>}>
      <IconButton size="small">
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

export default WasteEmissionFactorTooltip
