'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import HelpIcon from '@/components/base/HelpIcon'
import TagChip from '@/components/base/TagChip'
import Title from '@/components/base/Title'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { StudyTagColors } from '@/constants/studyTags'
import { StudyTagFamilyWithTags } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { createTag, deleteTag, getTagFamiliesByStudyId, updateTag } from '@/services/serverFunctions/emissionSource'
import { NewStudyTagCommand, NewStudyTagCommandValidation } from '@/services/serverFunctions/emissionSource.command'
import { zodResolver } from '@hookform/resolvers/zod'
import DeleteIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import { FormControl, Button as MuiButton } from '@mui/material'
import { StudyTagFamily } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import EditTagModal from './EditTagModal'
import styles from './StudyTag.module.css'
import StudyTagFamilyModal from './StudyTagFamilyModal'
import TagForm from './TagForm'

interface Props {
  studyId: string
}

const StudyTags = ({ studyId }: Props) => {
  const t = useTranslations('study.perimeter')
  const { callServerFunction } = useServerFunction()
  const [tagFamilies, setTagFamilies] = useState<StudyTagFamilyWithTags[]>([])
  const [editingFamily, setEditingFamily] = useState<Partial<StudyTagFamily> | null | undefined>(null)
  const [deletingFamily, setDeletingFamily] = useState<Partial<StudyTagFamily> | null>(null)
  const [glossary, setGlossary] = useState('')
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string; familyId: string } | null>(
    null,
  )

  const getEmissionSourceTags = useCallback(async () => {
    const response = await getTagFamiliesByStudyId(studyId)
    if (response.success && response.data) {
      setTagFamilies([...response.data])
    }
  }, [studyId])

  useEffect(() => {
    getEmissionSourceTags()
  }, [getEmissionSourceTags])

  const { control, formState, getValues, handleSubmit, setValue, watch } = useForm<NewStudyTagCommand>({
    resolver: zodResolver(NewStudyTagCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      color: StudyTagColors.DEFAULT,
    },
  })

  const color = watch('color')

  const onSubmit = async () => {
    await callServerFunction(() => createTag(getValues()), {
      onSuccess: () => {
        setValue('name', '')
        setValue('familyId', '')
        setValue('color', StudyTagColors.DEFAULT)
        getEmissionSourceTags()
      },
    })
  }

  const onUpdate = async (tagId: string, newName: string, newColor: string, newFamilyId: string) => {
    await callServerFunction(() => updateTag(tagId, newName, newColor, newFamilyId), {
      onSuccess: () => {
        getEmissionSourceTags()
      },
    })
  }

  const onDelete = async (tagId: string) => {
    await callServerFunction(() => deleteTag(tagId), {
      onSuccess: () => {
        getEmissionSourceTags()
      },
    })
  }

  const onEdit = (tag: { id: string; name: string; color: string | null; familyId: string }) => {
    setEditingTag({
      id: tag.id,
      name: tag.name,
      color: tag.color || StudyTagColors.DEFAULT,
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
      as="h3"
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
                {family.tags.map((tag) => (
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
          <Button
            className="mt1"
            data-testid="submit-button"
            type="submit"
            disabled={!tagFamilies.length || !formState.isValid}
          >
            {t('createEmissionSourceTag')}
          </Button>
        </FormControl>
      </Form>
      {editingFamily !== null && (
        <StudyTagFamilyModal
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
        <StudyTagFamilyModal
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

export default StudyTags
