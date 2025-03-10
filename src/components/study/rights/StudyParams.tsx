"use client"

import { useEffect, useState } from "react"

import { useForm } from "react-hook-form"
import { ChangeStudyNameCommand, ChangeStudyNameValidation } from "@/services/serverFunctions/study.command"
import { zodResolver } from "@hookform/resolvers/zod"
import { User } from "next-auth"
import { useTranslations } from "next-intl"
import { FullStudy } from "@/db/study"
import EditIcon from '@mui/icons-material/Edit'
import Block from "@/components/base/Block"
import Modal from "@/components/modals/Modal"
import { FormTextField } from "@/components/form/TextField"
import StudyLevel from "./StudyLevel"
import StudyPublicStatus from "./StudyPublicStatus"
import styles from './StudyParams.module.css'
import { changeStudyName } from "@/services/serverFunctions/study"


interface Props {
  user: User
  study: FullStudy
  disabled: boolean
}

const StudyParams = ({user, study, disabled }: Props) => {
  const t = useTranslations('study.rights')

  const [editTitle, setEditTitle] = useState(false)

  const form = useForm<ChangeStudyNameCommand>({
  resolver: zodResolver(ChangeStudyNameValidation),
  mode: 'onBlur',
  reValidateMode: 'onChange',
  defaultValues: {
    studyId: study.id,
    name: study.name,
  },
});

  const name = form.watch('name')

  const onSubmit = async (command: ChangeStudyNameCommand) => {
    const result = await changeStudyName(command)
    if (result) {
      // setError(result)
    }
  }

  useEffect(() => {
    if (name !== study.name) {
      onSubmit(form.getValues())
    }
  }, [name, study, form])

  return (
    <>
      <Block title={t('title', { name: study.name })} as="h1" actions={disabled ? undefined : [{ actionType: 'button', className: styles.iconButton, 'aria-label': t('edit'), title: t('edit'), children: <EditIcon color="info" />, onClick: () => setEditTitle(true) }]}>

        <StudyLevel study={study} user={user} disabled={disabled} />
        <StudyPublicStatus study={study} user={user} disabled={disabled} />
      </Block>
      <Modal
        open={editTitle}
        label={"edit-study-title"}
        title={t('edit')}
        onClose={() => setEditTitle(false)}
      >
        <FormTextField
          name="name"
          translation={t}
          control={form.control}
          error={!!form.formState.errors.name}
          helperText={form.formState.errors.name?.message}
          required
        />
      </Modal>
    </>
  )


}

export default StudyParams;