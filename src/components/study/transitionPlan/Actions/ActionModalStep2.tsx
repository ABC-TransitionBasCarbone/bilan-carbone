import { FormSelect } from '@/components/form/Select'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { Locale } from '@/i18n/config'
import { AddActionCommand } from '@/services/serverFunctions/transitionPlan.command'
import { Translations } from '@/types/translation'
import { getOrderedActionRelevances } from '@/utils/action'
import { Link, MenuItem } from '@mui/material'
import { ActionCategory, ActionNature } from '@prisma/client'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { useMemo } from 'react'
import { Control } from 'react-hook-form'

interface Props {
  control: Control<AddActionCommand>
}

const ActionModalStep1 = ({ control }: Props) => {
  const locale = useLocale()
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const tNature = useTranslations('study.transitionPlan.actions.nature')
  const tCategory = useTranslations('study.transitionPlan.actions.category')
  const tRelevance = useTranslations('study.transitionPlan.actions.relevance')

  const methodologyUrl = useMemo(() => {
    return locale === Locale.FR
      ? process.env.NEXT_PUBLIC_ACTION_RELEVANCE_DOC_URL_FR
      : process.env.NEXT_PUBLIC_ACTION_RELEVANCE_DOC_URL_EN
  }, [locale])

  const relevanceImageSrc = useMemo(() => {
    return locale === Locale.FR ? '/img/action-relevance-fr.avif' : '/img/action-relevance-en.png'
  }, [locale])

  const selectors: Record<
    'nature' | 'category' | 'relevance',
    { keys: string[]; t: Translations; icon?: React.ReactNode }
  > = {
    nature: { keys: Object.values(ActionNature), t: tNature, icon: undefined },
    category: { keys: Object.values(ActionCategory), t: tCategory, icon: undefined },
    relevance: {
      keys: getOrderedActionRelevances(),
      t: tRelevance,
      icon: (
        <GlossaryIconModal
          title="glossaryTitle"
          iconLabel="information"
          label="action-relevance"
          tModal="study.transitionPlan.actions.relevance"
        >
          <Image
            src={relevanceImageSrc}
            alt={tRelevance('glossaryTitle')}
            width={800}
            height={600}
            style={{ width: '100%', height: 'auto' }}
          />
          <p>
            {tRelevance('learnMore')}{' '}
            <Link href={methodologyUrl} target="_blank" rel="noopener noreferrer">
              {methodologyUrl}
            </Link>
          </p>
        </GlossaryIconModal>
      ),
    },
  }

  return (
    <>
      {Object.entries(selectors).map(([selector, values]) => (
        <FormSelect
          key={selector}
          control={control}
          translation={t}
          name={selector as keyof AddActionCommand}
          label={t(selector)}
          data-testid={`add-action-${selector}`}
          fullWidth
          multiple
          icon={values.icon}
          iconPosition="after"
        >
          {values.keys.map((key) => (
            <MenuItem key={key} value={key}>
              {values.t(key)}
            </MenuItem>
          ))}
        </FormSelect>
      ))}
    </>
  )
}

export default ActionModalStep1
