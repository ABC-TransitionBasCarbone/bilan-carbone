'use client'

import { ModelCampaignsWithOrga } from '@/db/campaign'
import { UpdateModelCampaignCommand } from '@/services/serverFunctions/modelCampaign.command'
import { Table as BaseTable } from '@abc-transitionbascarbone/components'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import Form from '@abc-transitionbascarbone/components/src/base/Form'
import LinkButton from '@abc-transitionbascarbone/components/src/base/LinkButton'
import LoadingButton from '@abc-transitionbascarbone/components/src/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/components/src/form/TextField'
import DownloadIcon from '@mui/icons-material/Download'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { Control, useForm } from 'react-hook-form'

interface Props {
  modelCampaigns: ModelCampaignsWithOrga
}

const SuperAdminPage = ({ modelCampaigns }: Props) => {
  const t = useTranslations('models')

  const form = useForm<UpdateModelCampaignCommand>({
    defaultValues: {
      modelCampaigns: modelCampaigns.map((modelCampaign) => ({
        ...modelCampaign,
      })),
    },
  })

  const onSubmit = async (command: UpdateModelCampaignCommand) => {}
  const control = form?.control as Control<UpdateModelCampaignCommand>

  const columns = [
    {
      id: 'name',
      header: () => <div className="align-center gapped">{t('name')}</div>,
      accessorKey: 'name',
      cell: ({ row, getValue }) => (
        <FormTextField
          data-testid="edit-site-name"
          size="small"
          control={control}
          name={`modelCampaigns.${row.index}.name`}
          placeholder={t('namePlaceholder')}
          fullWidth
        />
      ),
    },
    {
      id: 'download',
      header: () => t('json'),
      cell: ({ row }) => (
        <LinkButton
          onClick={() => {
            const model = row.original.model
            const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = `${row.original.name}.json`
            a.click()

            URL.revokeObjectURL(url)
          }}
        >
          <DownloadIcon />
        </LinkButton>
      ),
    },
    {
      id: 'org',
      header: () => <div>{t('organizationName')}</div>,
      cell: ({ row }) => <span>{row.original.organizationVersionMip?.name ?? '-'}</span>,
    },
  ] as ColumnDef<UpdateModelCampaignCommand['modelCampaigns'][0]>[]

  const table = useReactTable({
    columns,
    data: modelCampaigns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Block as="h1" title={t('editModels')}>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <BaseTable table={table} className="mt1" testId="sites" />
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="edit-organization-button">
          {t('edit')}
        </LoadingButton>
      </Form>
    </Block>
  )
}

export default SuperAdminPage
