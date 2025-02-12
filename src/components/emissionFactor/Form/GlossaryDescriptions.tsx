import { useTranslations } from 'next-intl'
import styles from './GlossaryDescriptions.module.css'

interface Props {
  field: string
}

const EmissionFactorFormDescription = ({ field }: Props) => {
  const t = useTranslations('emissionFactors.create.glossary')
  if (field === 'detailedGES' || field === 'subPartsCount') {
    return <p>{t(`${field}Description`)}</p>
  }
  if (field === 'multiple') {
    return (
      <div>
        <p className="mb-2">{t('multipleDescription.introduction')}</p>
        <ul className={styles.subPartslist}>
          <li className="mb-2">{t.rich('multipleDescription.upstream', { b: (children) => <b>{children}</b> })}</li>
          <li className="mb-2">{t.rich('multipleDescription.combustion', { b: (children) => <b>{children}</b> })}</li>
          <li className="mb-2">{t.rich('multipleDescription.loss', { b: (children) => <b>{children}</b> })}</li>
        </ul>
        <p>{t.rich('multipleDescription.conclusion', { b: (children) => <b>{children}</b> })}</p>
      </div>
    )
  }
  return null
}

export default EmissionFactorFormDescription
