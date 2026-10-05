'use client'

import ColorPicker from '@/components/base/ColorPicker'
import { StudyTagFamilyWithTags } from '@/db/study'
import { CustomFormLabel } from '@abc-transitionbascarbone/application/components/form/CustomFormLabel'
import { FormSelect } from '@abc-transitionbascarbone/application/components/form/Select'
import { FormTextField } from '@abc-transitionbascarbone/application/components/form/TextField'
import { Translations } from '@abc-transitionbascarbone/shared'
import { MenuItem } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Control } from 'react-hook-form'
import styles from './TagForm.module.css'

interface Props {
  color: string
  families: StudyTagFamilyWithTags[]
  onColorChange: (color: string) => void
  control: Control<{ name: string; familyId: string; color: string }>
  translation: Translations
  nameLabel?: string
  namePlaceholder?: string
  'data-testid': string
  disabled: boolean
}

const TagForm = ({
  color,
  families,
  onColorChange,
  control,
  translation,
  nameLabel,
  namePlaceholder,
  'data-testid': dataTestId,
  disabled,
}: Props) => {
  const t = useTranslations('study.perimeter')

  return (
    <div className="flex gapped my-2">
      <div className="flex-col">
        <CustomFormLabel label={t('color')} />
        <ColorPicker color={color} onChange={onColorChange} disabled={!families.length || disabled} />
      </div>
      <div className={styles.familySelector}>
        <FormSelect
          control={control}
          translation={translation}
          name="familyId"
          label={t('emissionSourceTagFamily')}
          data-testid={`${dataTestId}-family`}
          disabled={!families.length || disabled}
          autoWidth
        >
          {families.map((family) => (
            <MenuItem key={family.id} value={family.id}>
              {family.name}
            </MenuItem>
          ))}
        </FormSelect>
      </div>
      <FormTextField
        control={control}
        name="name"
        label={nameLabel || t('emissionSourceTagLabel')}
        placeholder={namePlaceholder}
        data-testid={`${dataTestId}-name`}
        disabled={!families.length || disabled}
      />
    </div>
  )
}

export default TagForm
