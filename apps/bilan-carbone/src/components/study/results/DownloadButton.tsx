import { CircularProgress, MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { MouseEvent } from 'react'

type Props = {
  label: string
  loading: boolean
  download: (e: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => Promise<void>
}
export const DownloadButton = ({ label, loading, download }: Props) => {
  const t = useTranslations('spinner')

  return (
    <MenuItem>
      {loading ? (
        <>
          <CircularProgress size="1rem" className="mr-2" />
          <p role="status">{t('loading')}</p>
        </>
      ) : (
        <div className="grow justify-start" onClick={download}>
          {label}
        </div>
      )}
    </MenuItem>
  )
}
