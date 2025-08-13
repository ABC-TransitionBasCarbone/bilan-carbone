'use client'

import Block from '@/components/base/Block'
import Button from '@/components/base/Button'
import Form from '@/components/base/Form'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import { emissionSourceTagColors } from '@/constants/emissionSourceTags'
import { EmissionSourceTagFamilyWithTags } from '@/db/study'
import AddIcon from '@mui/icons-material/Add'

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
import { Box, Chip, FormControl, MenuItem, Button as MuiButton, Select } from '@mui/material'
import { EmissionSourceTagFamily } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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

  useEffect(() => {
    getEmissionSourceTags()
  }, [studyId])

  const getEmissionSourceTags = async () => {
    const response = await getEmissionSourceTagsByStudyId(studyId)
    if (response.success && response.data) {
      setTagFamilies(response.data)
    }
  }

  const { getValues, control, handleSubmit, setValue } = useForm<NewEmissionSourceTagCommand>({
    resolver: zodResolver(NewEmissionSourceTagCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      color: emissionSourceTagColors.GREY,
    },
  })

  const onSubmit = async () => {
    const createdTag = await createEmissionSourceTag(getValues())
    if (createdTag.success) {
      const targetedFamily: EmissionSourceTagFamilyWithTags | undefined = tagFamilies.find(
        (family) => family.id === getValues().familyId,
      )
      if (targetedFamily) {
        targetedFamily?.emissionSourceTags.push(createdTag.data)
        const newTags = tagFamilies.filter((tag) => tag.id !== getValues().familyId).concat([targetedFamily])
        setTagFamilies(newTags)
      }
      setValue('name', '')
      setValue('familyId', '')
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
    <Block title={t('emissionSourceTags')}>
      {tagFamilies.length > 0 && (
        <div className={classNames(styles.gapped, 'flex')}>
          <>
            {tagFamilies.map((family) => (
              <div key={family.id} className={classNames(styles.gapped, 'flex')}>
                <div className="flex-col">
                  <div className={classNames(styles.gapped, 'flex')}>
                    <span className={classNames(styles.familyName, styles.gapped, 'flex bold pb-2')}>
                      {family.name}
                    </span>
                    <div>
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
                <div className={classNames(styles.separator, 'h100')} />
              </div>
            ))}
            <div className="ml2">
              <Button
                className={styles.familyNameButton}
                onClick={() => setEditingFamily(undefined)}
                title={t('family.new')}
              >
                <AddIcon />
              </Button>
            </div>
          </>
        </div>
      )}

      <Form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        <FormControl>
          <div className={classNames(styles.gapped, 'justify-between my-2')}>
            <Controller
              control={control}
              name="color"
              defaultValue={emissionSourceTagColors.GREY}
              render={({ field }) => (
                <FormControl className="inputContainer">
                  <div className="mb-2">
                    <span className="inputLabel bold">{t('color')}</span>
                  </div>
                  <Select
                    className={styles.colorInput}
                    {...field}
                    displayEmpty
                    data-testid="create-emission-source-tag-color"
                  >
                    {Object.values(emissionSourceTagColors).map((color) => (
                      <MenuItem key={color} value={color}>
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            margin: '2px',
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: '1px solid #ccc',
                          }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
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
          <Button data-testid="submit-button" type="submit">
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
    </Block>
  )
}

export default EmissionSourceTags
