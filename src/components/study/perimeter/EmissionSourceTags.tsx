'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import HelpIcon from '@/components/base/HelpIcon'
import TagChip from '@/components/base/TagChip'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { emissionSourceTagColors } from '@/constants/emissionSourceTags'
import { EmissionSourceTagFamilyWithTags } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  createEmissionSourceTag,
  deleteEmissionSourceTag,
  getEmissionSourceTagsByStudyId,
  updateEmissionSourceTag,
} from '@/services/serverFunctions/emissionSource'
import {
  NewEmissionSourceTagCommand,
  NewEmissionSourceTagCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { zodResolver } from '@hookform/resolvers/zod'
import DeleteIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import { FormControl, Button as MuiButton } from '@mui/material'
import { EmissionSourceTagFamily } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import EditTagModal from './EditTagModal'
import styles from './EmissionSourceTag.module.css'
import EmissionTagFamilyModal from './EmissionTagFamilyModal'
import TagForm from './TagForm'

interface Props {
  studyId: string
}

const EmissionSourceTags = ({ studyId }: Props) => {
  const t = useTranslations('study.perimeter')
  const { callServerFunction } = useServerFunction()
  const [tagFamilies, setTagFamilies] = useState<EmissionSourceTagFamilyWithTags[]>([])
  const [editingFamily, setEditingFamily] = useState<Partial<EmissionSourceTagFamily> | null | undefined>(null)
  const [deletingFamily, setDeletingFamily] = useState<Partial<EmissionSourceTagFamily> | null>(null)
  const [glossary, setGlossary] = useState('')
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string; familyId: string } | null>(
    null,
  )

  const getEmissionSourceTags = useCallback(async () => {
    const response = await getEmissionSourceTagsByStudyId(studyId)
    if (response.success && response.data) {
      setTagFamilies([...response.data])
    }
  }, [studyId])

  useEffect(() => {
    getEmissionSourceTags()
  }, [getEmissionSourceTags])

  const { control, formState, getValues, handleSubmit, setValue, watch } = useForm<NewEmissionSourceTagCommand>({
    resolver: zodResolver(NewEmissionSourceTagCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      color: emissionSourceTagColors.DEFAULT,
    },
  })

  const color = watch('color')

  const onSubmit = async () => {
    await callServerFunction(() => createEmissionSourceTag(getValues()), {
      onSuccess: () => {
        setValue('name', '')
        setValue('familyId', '')
        setValue('color', emissionSourceTagColors.DEFAULT)
        getEmissionSourceTags()
      },
    })
  }

  const onUpdate = async (tagId: string, newName: string, newColor: string, newFamilyId: string) => {
    await callServerFunction(() => updateEmissionSourceTag(tagId, newName, newColor, newFamilyId), {
      onSuccess: () => {
        getEmissionSourceTags()
      },
    })
  }

  const onDelete = async (tagId: string) => {
    await callServerFunction(() => deleteEmissionSourceTag(tagId), {
      onSuccess: () => {
        getEmissionSourceTags()
      },
    })
  }

  const onEdit = (tag: { id: string; name: string; color: string | null; familyId: string }) => {
    setEditingTag({
      id: tag.id,
      name: tag.name,
      color: tag.color || emissionSourceTagColors.DEFAULT,
      familyId: tag.familyId,
    })
  }

  return (
    <Block
      title={
        <>
          {t('emissionSourceTags')}{' '}
          {<HelpIcon label={t('family.glossary')} onClick={() => setGlossary('family.glossary')} />}
        </>
      }
    >
      <Title as="h5" className="mb-2 flex-start" title={t('family.title')} />
      <div className={classNames(styles.families, 'mb1')}>
        {tagFamilies.map((family) => (
          <Box key={family.id} className="fit-content mr2 px1">
            <div className="flex-col">
              <div className="flex justify-between align-center">
                <Title as="h6" className="flex mb0" title={family.name} />
                <div className="flex">
                  <MuiButton
                    className={styles.familyNameButton}
                    onClick={() => setEditingFamily(family)}
                    title={t('family.edit')}
                  >
                    <EditIcon />
                  </MuiButton>
                  <Button
                    className={styles.familyNameButton}
                    title={t('family.delete')}
                    onClick={() => setDeletingFamily(family)}
                    color="error"
                    variant="text"
                  >
                    <DeleteIcon />
                  </Button>
                </div>
              </div>
              <div className={classNames(styles.tags)}>
                {family.emissionSourceTags.map((tag) => (
                  <TagChip
                    key={tag.id}
                    id={tag.id}
                    name={tag.name}
                    color={tag.color}
                    onClick={() => onEdit({ ...tag, familyId: family.id })}
                    onDelete={() => onDelete(tag.id)}
                  />
                ))}
              </div>
            </div>
          </Box>
        ))}
      </div>
      <Button className={classNames(styles.addFamilyButton, 'mb2')} onClick={() => setEditingFamily(undefined)}>
        {t('family.new')}
      </Button>
      <Title as="h5" className="mb-2" title={t('family.add')} />
      <Form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <FormControl>
          <TagForm
            color={color}
            families={tagFamilies}
            onColorChange={(value) => setValue('color', value)}
            control={control}
            translation={t}
            namePlaceholder={t('emissionSourceTagsPlaceholder')}
            data-testid="create-emission-source-tag"
          />
          <Button data-testid="submit-button" type="submit" disabled={!tagFamilies.length || !formState.isValid}>
            {t('createEmissionSourceTag')}
          </Button>
        </FormControl>
      </Form>
      {editingFamily !== null && (
        <EmissionTagFamilyModal
          action="edit"
          studyId={studyId}
          family={editingFamily}
          onClose={() => {
            setEditingFamily(null)
            getEmissionSourceTags()
          }}
        />
      )}
      {deletingFamily && (
        <EmissionTagFamilyModal
          action="delete"
          studyId={studyId}
          family={deletingFamily}
          onClose={() => {
            setDeletingFamily(null)
            getEmissionSourceTags()
          }}
        />
      )}
      {editingTag && (
        <EditTagModal
          tagId={editingTag.id}
          currentName={editingTag.name}
          currentColor={editingTag.color}
          currentFamilyId={editingTag.familyId}
          families={tagFamilies}
          onSave={onUpdate}
          onClose={() => setEditingTag(null)}
        />
      )}
      {glossary && (
        <GlossaryModal glossary={glossary} label="post-glossary" t={t} onClose={() => setGlossary('')}>
          {t.rich('family.glossaryDescription', { br: () => <br /> })}
        </GlossaryModal>
      )}
    </Block>
  )
}

export default EmissionSourceTags
