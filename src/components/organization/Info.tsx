'use client'

import { OrganizationWithSites } from '@/db/account'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteOrganizationCommand } from '@/services/serverFunctions/organization'
import { DeleteCommand, DeleteCommandValidation } from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Block, { Props as BlockProps } from '../base/Block'
import DeletionModal from '../modals/DeletionModal'
import styles from './Info.module.css'

interface Props {
  organizationVersion: OrganizationWithSites
  canDelete: boolean
  canUpdate: boolean
}

const OrganizationInfo = ({ organizationVersion, canDelete, canUpdate }: Props) => {
  const t = useTranslations('organization')
  const tDelete = useTranslations('organization.delete')
  const { callServerFunction } = useServerFunction()
  const [deleting, setDeleting] = useState(false)

  const router = useRouter()

  const form = useForm<DeleteCommand>({
    resolver: zodResolver(DeleteCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      id: organizationVersion.id,
      name: '',
    },
  })

  const onDelete = async () => {
    await callServerFunction(() => deleteOrganizationCommand(form.getValues()), {
      getErrorMessage: (error) => tDelete(error),
      onSuccess: () => {
        router.push('/')
      },
    })
  }

  const deleteAction: BlockProps['actions'] = canDelete
    ? [
        {
          actionType: 'button',
          onClick: () => setDeleting(true),
          'data-testid': 'delete-organization-button',
          children: tDelete('button'),
          color: 'error',
        },
      ]
    : []

  const updateAction: BlockProps['actions'] = canUpdate
    ? [
        {
          actionType: 'link',
          href: `/organisations/${organizationVersion.id}/modifier`,
          'data-testid': 'edit-organization-button',
          children: t('modify'),
        },
      ]
    : []

  return (
    <>
      <Block as="h1" title={t('myOrganization')} actions={[...deleteAction, ...updateAction]}>
        <p data-testid="organization-name">
          <span className={styles.info}>{t('name')}</span> {organizationVersion.organization.name}
        </p>
      </Block>
      {deleting && (
        <DeletionModal
          form={form}
          type="organization"
          onDelete={onDelete}
          onClose={() => setDeleting(false)}
          t={tDelete}
        />
      )}
    </>
  )
}

export default OrganizationInfo
