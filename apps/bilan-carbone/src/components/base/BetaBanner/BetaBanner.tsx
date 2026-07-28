import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import Chip from '@mui/material/Chip'
import { getTranslations } from 'next-intl/server'
import styles from './BetaBanner.module.css'

const BetaBanner = async () => {
  const t = await getTranslations('betaBanner')

  return (
    <div className={`flex-col p1 gapped-2 mb2 ${styles.banner}`}>
      <div className="align-center gapped-2">
        <Chip label={t('badge')} size="small" color="warning" className={styles.chip} />
        <strong>{t('title')}</strong>
      </div>
      <p className="m0">{customRich(t, 'description', {}, Environment.TILT)}</p>
    </div>
  )
}

export default BetaBanner
