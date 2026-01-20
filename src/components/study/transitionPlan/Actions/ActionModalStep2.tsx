import { FormSelect } from '@/components/form/Select'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { Locale } from '@/i18n/config'
import { AddActionFormCommand } from '@/services/serverFunctions/transitionPlan.command'
import { Translations } from '@/types/translation'
import { getOrderedActionRelevances } from '@/utils/action'
import { Checkbox, ListItemText, MenuItem } from '@mui/material'
import { ActionCategory, ActionNature } from '@prisma/client'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { Control, useWatch } from 'react-hook-form'

interface Props {
  control: Control<AddActionFormCommand>
}

const ActionModalStep2 = ({ control }: Props) => {
  const locale = useLocale()
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const tNature = useTranslations('study.transitionPlan.actions.nature')
  const tCategory = useTranslations('study.transitionPlan.actions.category')
  const tRelevance = useTranslations('study.transitionPlan.actions.relevance')

  const methodologyUrl = useMemo(() => {
    return locale === Locale.FR
      ? process.env.NEXT_PUBLIC_ACTION_RELEVANCE_DOC_URL_FR || ''
      : process.env.NEXT_PUBLIC_ACTION_RELEVANCE_DOC_URL_EN || ''
  }, [locale])

  const relevanceImageSrc = useMemo(() => {
    return locale === Locale.FR ? '/img/action-relevance-fr.png' : '/img/action-relevance-en.png'
  }, [locale])

  const nature = useWatch({ control, name: 'nature' })
  const category = useWatch({ control, name: 'category' })
  const relevance = useWatch({ control, name: 'relevance' })

  const watchedSelectors = useMemo(() => ({ nature, category, relevance }), [nature, category, relevance])

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
            {tRelevance.rich('learnMore', {
              link: (children) => (
                <Link href={methodologyUrl} target="_blank" rel="noreferrer noopener">
                  {children}
                </Link>
              ),
            })}
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
          name={selector as keyof AddActionFormCommand}
          label={t(selector)}
          data-testid={`add-action-${selector}`}
          fullWidth
          multiple
          icon={values.icon}
          iconPosition="after"
          renderValue={() => {
            const selectedValues = watchedSelectors[selector as keyof typeof watchedSelectors] as string[]
            return selectedValues.map((value) => values.t(value)).join(', ')
          }}
        >
          {values.keys.map((key) => (
            <MenuItem key={key} value={key}>
              <Checkbox
                checked={(watchedSelectors[selector as keyof typeof watchedSelectors] as string[])?.includes(key)}
              />
              <ListItemText primary={values.t(key)} />
            </MenuItem>
          ))}
        </FormSelect>
      ))}
    </>
  )
}

export default ActionModalStep2
