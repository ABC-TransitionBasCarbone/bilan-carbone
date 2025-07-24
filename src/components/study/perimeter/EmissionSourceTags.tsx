'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import { FormTextField } from '@/components/form/TextField'
import {
  createEmissionSourceTag,
  deleteEmissionSourceTag,
  getEmissionSourceTagsByStudyId,
} from '@/services/serverFunctions/emissionSource'
import {
  NewEmissionSourceTagCommand,
  NewEmissionSourceTagCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { Chip, FormControl } from '@mui/material'
import { EmissionSourceTag } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './EmissionSourceTag.module.css'

interface Props {
  studyId: string
}

const EmissionSourceTags = ({ studyId }: Props) => {
  const t = useTranslations('study.perimeter')

  const [tags, setTags] = useState<EmissionSourceTag[]>([])

  useEffect(() => {
    getEmissionSourceTags()
  }, [studyId])

  const getEmissionSourceTags = async () => {
    const response = await getEmissionSourceTagsByStudyId(studyId)
    if (response.success && response.data) {
      setTags(response.data)
    }
  }

  const { getValues, control, handleSubmit, setValue } = useForm<NewEmissionSourceTagCommand>({
    resolver: zodResolver(NewEmissionSourceTagCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId,
    },
  })

  const onSubmit = async () => {
    const createTag = await createEmissionSourceTag(getValues())
    if (createTag.success) {
      setTags((prevTags) => [...prevTags, createTag.data])
      setValue('name', '')
    }
  }

  const onDelete = async (tagId: string) => {
    const deleteTag = await deleteEmissionSourceTag(tagId)
    if (deleteTag.success) {
      setTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId))
    }
  }

  return (
    <Block title={t('emissionSourceTags')}>
      {tags.length > 0 && (
        <div className={styles.tags}>
          {tags.map((tag) => (
            <Chip onDelete={() => onDelete(tag.id)} color="primary" key={tag.id} label={tag.name} />
          ))}
        </div>
      )}

      <Form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <FormControl>
          <FormTextField
            control={control}
            translation={t}
            name="name"
            label={t('emissionSourceTag')}
            placeholder={t('emissionSourceTagsPlaceholder')}
            data-testid="create-emission-source-tags"
          />
          <Button data-testid="submit-button" type="submit" fullWidth>
            {t('validate')}
          </Button>
        </FormControl>
      </Form>
    </Block>
  )
}

export default EmissionSourceTags
