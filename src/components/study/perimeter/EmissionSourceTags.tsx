'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import ColorPicker from '@/components/base/ColorPicker'
import Form from '@/components/base/Form'
import HelpIcon from '@/components/base/HelpIcon'
import TagChip from '@/components/base/TagChip'
import Title from '@/components/base/Title'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
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
import { FormControl, MenuItem, Button as MuiButton } from '@mui/material'
import { EmissionSourceTagFamily } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import EditTagModal from './EditTagModal'
import styles from './EmissionSourceTag.module.css'
import EmissionTagFamilyModal from './EmissionTagFamilyModal'

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
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null)

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

  const onUpdate = async (tagId: string, newName: string, newColor: string) => {
    await callServerFunction(() => updateEmissionSourceTag(tagId, newName, newColor), {
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

  const onEdit = (tag: { id: string; name: string; color: string | null }) => {
    setEditingTag({
      id: tag.id,
      name: tag.name,
      color: tag.color || emissionSourceTagColors.DEFAULT,
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
                    onClick={() => onEdit(tag)}
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
          <div className="justify-between gapped my-2">
            <div className="flex-col">
              <div className="mb-2">
                <span className="inputLabel bold">{t('color')}</span>
              </div>
              <ColorPicker color={color} onChange={(value) => setValue('color', value)} />
            </div>
            <div className={styles.selector}>
              <FormSelect
                control={control}
                translation={t}
                name="familyId"
                label={t('emissionSourceTagFamily')}
                data-testid="create-emission-source-tag-family"
                fullWidth
              >
                {tagFamilies.map((family) => (
                  <MenuItem key={family.id} value={family.id}>
                    {family.name}
                  </MenuItem>
                ))}
              </FormSelect>
            </div>
            <FormTextField
              control={control}
              translation={t}
              name="name"
              label={t('emissionSourceTagLabel')}
              placeholder={t('emissionSourceTagsPlaceholder')}
              data-testid="create-emission-source-tagFamilies"
            />
          </div>
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
