import Block from '@/components/base/Block'
import { useTranslations } from 'next-intl'
import DownloadIcon from '@mui/icons-material/Download'

const Admin = () => {
  const t = useTranslations('admin')
  return (
    <Block title={t('title')} as="h1">
      <DownloadIcon />

    </Block>
  )
}

export default Admin
