'use client'

import Block from '@/components/base/Block'
import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import ColorPicker from '@/components/base/ColorPicker'
import Form from '@/components/base/Form'
import HelpIcon from '@/components/base/HelpIcon'
import Title from '@/components/base/Title'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { emissionSourceTagColors } from '@/constants/emissionSourceTags'
import { EmissionSourceTagFamilyWithTags } from '@/db/study'
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
import DeleteIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import { Chip, FormControl, MenuItem, Button as MuiButton } from '@mui/material'
import { EmissionSourceTagFamily } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './EmissionSourceTag.module.css'
import EmissionTagFamilyModal from './EmissionTagFamilyModal'

interface Props {
  studyId: string
}

const EmissionSourceTags = ({ studyId }: Props) => {
  const t = useTranslations('study.perimeter')

  const [tagFamilies, setTagFamilies] = useState<EmissionSourceTagFamilyWithTags[]>([])
  const [editingFamily, setEditingFamily] = useState<Partial<EmissionSourceTagFamily> | null | undefined>(null)
  const [deletingFamily, setDeletingFamily] = useState<Partial<EmissionSourceTagFamily> | null>(null)
  const [glossary, setGlossary] = useState('')

  useEffect(() => {
    getEmissionSourceTags()
  }, [studyId])

  const getEmissionSourceTags = async () => {
    const response = await getEmissionSourceTagsByStudyId(studyId)
    if (response.success && response.data) {
      setTagFamilies(response.data)
    }
  }

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
    const createdTag = await createEmissionSourceTag(getValues())
    if (createdTag.success) {
      const targetedFamily: EmissionSourceTagFamilyWithTags | undefined = tagFamilies.find(
        (family) => family.id === getValues().familyId,
      )
      if (targetedFamily) {
        setTagFamilies((prevTags) =>
          prevTags.map((family) => ({
            ...family,
            emissionSourceTags:
              family.id === getValues().familyId
                ? family.emissionSourceTags.concat(createdTag.data)
                : family.emissionSourceTags,
          })),
        )
      }
      setValue('name', '')
      setValue('familyId', '')
      setValue('color', emissionSourceTagColors.DEFAULT)
    }
  }

  const onDelete = async (tagId: string) => {
    const deleteTag = await deleteEmissionSourceTag(tagId)
    if (deleteTag.success) {
      setTagFamilies((prevTags) =>
        prevTags.map((family) => ({
          ...family,
          emissionSourceTags: family.emissionSourceTags.filter((tag) => tag.id !== tagId),
        })),
      )
    }
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
              <div className="flex justify-between align-center mb1">
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
              {family.emissionSourceTags.map((tag) => (
                <div key={tag.id} className={classNames(styles.tags)}>
                  <Chip
                    className={styles.tag}
                    onDelete={() => onDelete(tag.id)}
                    sx={{ bgcolor: tag.color }}
                    label={tag.name}
                  />
                </div>
              ))}
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
          <div className={classNames(styles.gapped, 'justify-between my-2')}>
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
      {glossary && (
        <GlossaryModal glossary={glossary} label="post-glossary" t={t} onClose={() => setGlossary('')}>
          {t.rich('family.glossaryDescription', { br: () => <br /> })}
        </GlossaryModal>
      )}
    </Block>
  )
}

export default EmissionSourceTags
