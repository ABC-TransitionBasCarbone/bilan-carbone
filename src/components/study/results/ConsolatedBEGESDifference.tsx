import Button from '@/components/base/Button'
import Modal from '@/components/modals/Modal'
import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { computeBegesResult } from '@/services/results/beges'
import { computeResultsByPost } from '@/services/results/consolidated'
import LightbulbIcon from '@mui/icons-material/LightbulbOutlined'
import { Export, ExportRule, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import styles from './ConsolatedBEGESDifference.module.css'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  studySite: string
  validatedOnly: boolean
}

const Difference = ({ study, rules, emissionFactorsWithParts, studySite, validatedOnly }: Props) => {
  const t = useTranslations('study.results.difference')
  const tPost = useTranslations('emissionFactors.post')
  const [open, setOpen] = useState(false)
  const begesRules = useMemo(() => rules.filter((rule) => rule.export === Export.Beges), [rules])
  const beges = useMemo(
    () => computeBegesResult(study, begesRules, emissionFactorsWithParts, studySite, true, validatedOnly),
    [study, begesRules, emissionFactorsWithParts, studySite, validatedOnly],
  )
  const begesTotal = beges.find((result) => result.rule === 'total')?.total
  const computedResults = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
    [study, studySite, validatedOnly],
  )
  const computedTotal = computedResults.find((result) => result.post === 'total')?.value

  const utilisationEnDependance = computedResults
    .find((result) => result.post === Post.UtilisationEtDependance)
    ?.subPosts.find((subPost) => subPost.post === SubPost.UtilisationEnDependance)
  const hasUtilisationEnDependance = !!utilisationEnDependance && utilisationEnDependance.value !== 0

  const wasteEmissionSourcesOnStudy = study.emissionSources.filter(
    (emissionSource) =>
      emissionSource.emissionFactor &&
      emissionSource.emissionFactor.importedId &&
      wasteEmissionFactors[emissionSource.emissionFactor.importedId],
  )

  return begesTotal !== computedTotal ? (
    <>
      <div className={classNames(styles.button, 'flex-cc p-2 px1')} onClick={() => setOpen(true)}>
        <LightbulbIcon />
        {t('button')}
      </div>
      <Modal open={open} title={t('modalTitle')} label="computed-beges-difference" onClose={() => setOpen(false)}>
        {hasUtilisationEnDependance && <p className="mb1">{t('dependance')}</p>}
        {!!wasteEmissionSourcesOnStudy.length && (
          <div className="mb1">
            <p className="mb-2">{t('waste')}</p>
            <ul className={styles.wasteList}>
              {wasteEmissionSourcesOnStudy.map((emissionSource) => (
                <li key={`waste-emission-source-${emissionSource.id}`}>{emissionSource.name}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="justify-end">
          <Button onClick={() => setOpen(false)}>{t('close')}</Button>
        </div>
      </Modal>
    </>
  ) : (
    <></>
  )
}

export default Difference
