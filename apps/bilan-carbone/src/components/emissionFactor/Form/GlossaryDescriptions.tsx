import { customRich } from '@/i18n/customRich'
import { useTranslations } from 'next-intl'
import styles from './GlossaryDescriptions.module.css'

interface Props {
  field: string
}

const EmissionFactorFormDescription = ({ field }: Props) => {
  const t = useTranslations('emissionFactors.create.glossary')
  if (field === 'detailedGES') {
    return <p>{t(`${field}Description`)}</p>
  }
  if (field === 'multiple') {
    return (
      <div>
        <p className="mb-2">{t('multipleDescription.introduction')}</p>
        <ul className={styles.subPartslist}>
          <li className="mb-2">{customRich(t, 'multipleDescription.upstream')}</li>
          <li className="mb-2">{customRich(t, 'multipleDescription.combustion')}</li>
          <li className="mb-2">{customRich(t, 'multipleDescription.loss')}</li>
        </ul>
        <p>{customRich(t, 'multipleDescription.conclusion')}</p>
      </div>
    )
  }
  return null
}

export default EmissionFactorFormDescription
