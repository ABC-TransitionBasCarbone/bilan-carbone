'use client'

import Form from '@/components/base/Form'
import { EmissionSourceTagFamilyWithTags } from '@/db/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Modal from '../../modals/Modal'
import TagForm from './TagForm'

interface Props {
  tagId: string
  currentName: string
  currentColor: string
  currentFamilyId: string
  families: EmissionSourceTagFamilyWithTags[]
  onSave: (tagId: string, newName: string, newColor: string, newFamilyId: string) => Promise<void>
  onClose: () => void
}

const EditTagFormSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  familyId: z.string().min(1),
})

type EditTagFormData = z.infer<typeof EditTagFormSchema>

const EditTagModal = ({ tagId, currentName, currentColor, currentFamilyId, families, onSave, onClose }: Props) => {
  const t = useTranslations('study.perimeter')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const { control, handleSubmit, setValue, watch, getValues } = useForm<EditTagFormData>({
    resolver: zodResolver(EditTagFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: currentName,
      color: currentColor,
      familyId: currentFamilyId,
    },
  })

  const color = watch('color')

  const onSubmit = async () => {
    setIsLoading(true)
    try {
      const values = getValues()
      await onSave(tagId, values.name, values.color, values.familyId)
      onClose()
    } catch (error) {
      console.error('Failed to update tag:', error)
    } finally {
      setIsLoading(false)
      router.refresh()
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      label="edit-tag"
      title={t('editTagTitle')}
      actions={[
        { actionType: 'button', children: t('cancel'), onClick: onClose },
        { actionType: 'loadingButton', children: t('updateTag'), onClick: handleSubmit(onSubmit), loading: isLoading },
      ]}
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormControl>
          <TagForm
            color={color}
            families={families}
            onColorChange={(value) => setValue('color', value)}
            control={control}
            translation={t}
            data-testid="edit-tag"
          />
        </FormControl>
      </Form>
    </Modal>
  )
}

export default EditTagModal
